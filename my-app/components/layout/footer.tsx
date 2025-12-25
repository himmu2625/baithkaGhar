"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { useSession } from "next-auth/react"
import { usePathname } from "next/navigation"

import Link from "next/link"
import {
  Facebook,
  Instagram,
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
} from "lucide-react"
import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  YoutubeIcon,
  MailIcon,
  PhoneIcon,
  SendIcon,
  ShieldIcon,
  HelpIcon,
  SparklesIcon,
  ChartIcon,
  ArrowRightIcon,
  LocationIcon,
  BuildingIcon,
} from "@/components/ui/enhanced-icons"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function Footer() {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const { data: session } = useSession()
  const pathname = usePathname()

  // Check if we're in admin section
  const isAdminRoute =
    pathname?.startsWith("/admin") &&
    pathname !== "/admin/login" &&
    pathname !== "/admin/setup"

  // Direct navigation function using window.open
  const navigateTo = (path: string) => {
    // Check for previously recorded navigation attempt to avoid loops
    const lastPath = sessionStorage.getItem("lastNavPath")
    const now = new Date().getTime()
    const lastNavTime = parseInt(sessionStorage.getItem("lastNavTime") || "0")
    const timeDiff = now - lastNavTime

    // If we're trying to navigate to the same path within 1 second, it might be a loop
    if (lastPath === path && timeDiff < 1000) {
      console.warn(
        "Navigation loop detected in footer, redirecting to home instead"
      )
      window.location.href = "/"
      return
    }

    // Record this navigation attempt
    sessionStorage.setItem("lastNavPath", path)
    sessionStorage.setItem("lastNavTime", now.toString())

    // Use normal navigation
    window.location.href = path
  }

  // Improved protected link handler with forced navigation
  const handleProtectedLink = (path: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Clear session check
    if (session?.user) {
      console.log(
        `Footer: User is authenticated, forcefully navigating to ${path}`
      )
      // Use window.open with _self to force a fresh page load
      window.open(path, "_self")
    } else {
      console.log(
        `Footer: User is not authenticated, redirecting to login with callback to ${path}`
      )
      // Redirect to login page with callback URL
      window.open(`/login?callbackUrl=${encodeURIComponent(path)}`, "_self")
    }
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email && email.includes("@")) {
      setIsSubscribed(true)
      setEmail("")
      setTimeout(() => setIsSubscribed(false), 3000)
    }
  }

  // Improved rendering for quick links with clearer auth handling
  const renderQuickLink = (link: any) => {
    // Special handling for "Contact Us" - opens WhatsApp
    if (link.label === "Contact Us") {
      const handleWhatsAppClick = (e: React.MouseEvent) => {
        e.preventDefault()
        const phoneNumber = "+91 9356547176"
        const message = "Hello! I need assistance with booking."
        const whatsappUrl = `https://wa.me/${phoneNumber.replace(
          /\s/g,
          ""
        )}?text=${encodeURIComponent(message)}`
        window.open(whatsappUrl, "_blank")
      }

      return (
        <a
          href="#"
          className="group flex items-center text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base w-full text-left"
          onClick={handleWhatsAppClick}
        >
          <span className="mr-1.5 xs:mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <link.icon className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
          </span>
          <span className="border-b border-transparent group-hover:border-lightGreen/30 pb-0.5">
            {link.label}
          </span>
        </a>
      )
    }

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
      )
    }

    // Standard public links
    return (
      <a
        href={link.href}
        className="group flex items-center text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base w-full text-left"
        onClick={(e) => {
          e.preventDefault()
          navigateTo(link.href)
        }}
      >
        <span className="mr-1.5 xs:mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <link.icon className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
        </span>
        <span className="border-b border-transparent group-hover:border-lightGreen/30 pb-0.5">
          {link.label}
        </span>
      </a>
    )
  }

  // If we're in admin route, show a simplified footer that works with the admin layout
  if (isAdminRoute) {
    return (
      <footer className="bg-darkGreen text-lightYellow w-full border-t-2 border-lightGreen/50 shadow-lg">
        <div className="px-6 py-4">
          <div className="flex flex-col md:flex-row md:justify-between items-center">
            <p className="text-lightYellow text-sm mb-2 md:mb-0">
              &copy; {new Date().getFullYear()} Baithaka Ghar. All rights
              reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-lightYellow">
              <a
                href="/terms"
                className="hover:text-lightGreen transition-colors hover:underline"
              >
                Terms of Service
              </a>
              <a
                href="/privacy"
                className="hover:text-lightGreen transition-colors hover:underline"
              >
                Privacy Policy
              </a>
              <a
                href="/cookies"
                className="hover:text-lightGreen transition-colors hover:underline"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    )
  }

  return (
    <footer className="bg-darkGreen text-lightYellow relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-lightGreen/10 via-lightGreen to-lightGreen/10"></div>
      <div className="absolute -top-12 right-20 w-32 h-32 rounded-full bg-lightGreen/15 blur-xl"></div>
      <div className="absolute bottom-20 left-10 w-40 h-40 rounded-full bg-lightGreen/15 blur-xl"></div>
      <div className="absolute top-1/3 left-1/2 w-24 h-24 rounded-full bg-lightGreen/10 blur-lg"></div>

      <div className="container mx-auto px-3 xs:px-4 py-6 xs:py-8 sm:py-10 relative z-10">
        {/* Main footer content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-6 xs:gap-8 md:gap-6 mb-6 xs:mb-8 sm:mb-10">
          {/* Company info and social - 3 columns on md+ */}
          <div className="md:col-span-3 border-l-2 border-lightGreen/20 pl-4">
            <div className="mb-4 xs:mb-5 pr-3">
              <Link
                href="/"
                className="group mb-3 xs:mb-4 flex items-center"
                aria-label="Go to homepage"
              >
                <div
                  className="relative flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: "52px",
                    height: "52px",
                    maxWidth: "70%",
                    maxHeight: "70%",
                  }}
                >
                  <Image
                    src="/Logo.png"
                    alt="Baithaka Ghar Logo"
                    width={52}
                    height={52}
                    className="object-contain"
                  />
                </div>
                <span className="text-lightGreen font-bold text-2xl ml-0 pr-3">
                  Baithaka Ghar
                </span>
              </Link>
              <p className="text-lightYellow/80 mb-4 xs:mb-5 max-w-md text-sm xs:text-base leading-relaxed">
                Experience premium stays across India with Baithaka Ghar. We
                offer exceptional accommodations with a focus on comfort,
                convenience, and unforgettable experiences.
              </p>

              {/* Newsletter subscription with enhanced styling */}
              <div className="bg-lightGreen/5 backdrop-blur-md rounded-lg p-4 border border-lightGreen/20">
                <h3 className="text-base xs:text-lg font-semibold mb-3 text-lightGreen flex items-center gap-2">
                  <SendIcon size="sm" />
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
                    <SendIcon
                      size="sm"
                      className="absolute right-2 xs:right-3 top-1/2 transform -translate-y-1/2 text-lightGreen/50"
                    />
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
                  className="bg-lightGreen/10 hover:bg-lightGreen/20 p-2 xs:p-2.5 rounded-full text-lightGreen hover:text-white transition-all duration-300 hover:scale-110 group"
                  aria-label={social.name}
                >
                  <social.icon className="h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 group-hover:animate-pulse-light" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links - 2 columns on md+ */}
          <div className="md:col-span-2 sm:col-start-1 md:col-start-auto border-l-2 border-lightGreen/20 pl-4">
            <h3 className="text-base xs:text-xl font-bold mb-3 xs:mb-5 text-lightGreen flex items-center gap-1.5 xs:gap-2">
              <ArrowRightIcon size="sm" />
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
              <ArrowRightIcon size="sm" />
              Support
            </h3>
            <ul className="space-y-1.5 xs:space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="group flex items-center text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base w-full text-left"
                    onClick={(e) => {
                      e.preventDefault()
                      navigateTo(link.href)
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
                <ArrowRightIcon size="sm" />
                Contact Us
              </h3>
              <ul className="space-y-1.5 xs:space-y-3">
                <li className="flex items-center group text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base">
                  <MailIcon
                    size="sm"
                    className="mr-1.5 xs:mr-2 text-lightGreen"
                  />
                  <a
                    href="mailto:anuragsingh@baithakaghar.com"
                    className="border-b border-transparent group-hover:border-lightGreen/30 pb-0.5"
                  >
                    anuragsingh@baithakaghar.com
                  </a>
                </li>
                <li className="flex items-center group text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base">
                  <PhoneIcon
                    size="sm"
                    className="mr-1.5 xs:mr-2 text-lightGreen"
                  />
                  <a
                    href="tel:+91 9356547176"
                    className="border-b border-transparent group-hover:border-lightGreen/30 pb-0.5"
                  >
                    +91 9356547176
                  </a>
                </li>
                <li className="flex items-center group text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base">
                  <PhoneIcon
                    size="sm"
                    className="mr-1.5 xs:mr-2 text-lightGreen"
                  />
                  <a
                    href="tel:+91 9936712614"
                    className="border-b border-transparent group-hover:border-lightGreen/30 pb-0.5"
                  >
                    +91 9936712614
                  </a>
                </li>
                <li className="flex items-center group text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base">
                  <svg
                    className="mr-1.5 xs:mr-2 text-lightGreen w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488" />
                  </svg>
                  <a
                    href="#"
                    className="border-b border-transparent group-hover:border-lightGreen/30 pb-0.5"
                    onClick={(e) => {
                      e.preventDefault()
                      const phoneNumber = "+91 9356547176"
                      const message = "Hello! I need assistance with booking."
                      const whatsappUrl = `https://wa.me/${phoneNumber.replace(
                        /\s/g,
                        ""
                      )}?text=${encodeURIComponent(message)}`
                      window.open(whatsappUrl, "_blank")
                    }}
                  >
                    WhatsApp Support
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom section with copyright */}
        <div className="border-t border-lightGreen/30 pt-4 xs:pt-6 flex flex-col md:flex-row md:justify-between items-center">
          <p className="text-lightYellow/70 text-xs xs:text-sm mb-3 md:mb-0">
            &copy; {new Date().getFullYear()} Baithaka Ghar. All rights
            reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-4 xs:gap-5 md:gap-8 text-xs xs:text-sm text-lightYellow/70">
            <a
              href="/terms"
              className="hover:text-lightGreen transition-colors hover:underline"
              onClick={(e) => {
                e.preventDefault()
                navigateTo("/terms")
              }}
            >
              Terms of Service
            </a>
            <a
              href="/privacy"
              className="hover:text-lightGreen transition-colors hover:underline"
              onClick={(e) => {
                e.preventDefault()
                navigateTo("/privacy")
              }}
            >
              Privacy Policy
            </a>
            <a
              href="/cookies"
              className="hover:text-lightGreen transition-colors hover:underline"
              onClick={(e) => {
                e.preventDefault()
                navigateTo("/cookies")
              }}
            >
              Cookie Policy
            </a>
            <a
              href="/admin/login"
              className="flex items-center text-xs xs:text-sm hover:text-lightGreen transition-colors ml-1 xs:ml-2"
              onClick={(e) => {
                e.preventDefault()
                // Check if user is already authenticated
                if (session?.user) {
                  // If user has admin role, send to dashboard directly
                  if (
                    session.user.role === "admin" ||
                    session.user.role === "super_admin"
                  ) {
                    navigateTo("/admin/dashboard")
                  } else {
                    // Non-admin users go to login with an unauthorized message
                    sessionStorage.setItem("adminLoginInfo", "unauthorized")
                    navigateTo("/admin/login")
                  }
                } else {
                  // Unauthenticated users go to the login page
                  navigateTo("/admin/login")
                }
              }}
            >
              <ShieldIcon size="sm" className="mr-1" />
              Admin Portal
            </a>
            <a
              href="/os/login"
              className="flex items-center text-xs xs:text-sm hover:text-lightGreen transition-colors ml-1 xs:ml-2"
              onClick={(e) => {
                e.preventDefault()
                window.open("/os/login", "_blank", "noopener,noreferrer")
              }}
            >
              <BuildingIcon size="sm" className="mr-1" />
              Baithaka Ghar OS
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Social media links data
const socialLinks = [
  {
    name: "Facebook",
    icon: FacebookIcon,
    url: "https://www.facebook.com/share/1AhQXAqmZW/",
  },
  { name: "Instagram", icon: InstagramIcon, url: "https://instagram.com" },
  {
    name: "LinkedIn",
    icon: LinkedinIcon,
    url: "https://www.linkedin.com/in/baithaka-ghar-5a972a371?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
  },
  {
    name: "YouTube",
    icon: YoutubeIcon,
    url: "https://youtube.com/@anuragsingh-h9o?si=LW13oM4YCFLgVE7f",
  },
]

// Quick links data
const quickLinks = [
  { label: "About Us", href: "/about", icon: SparklesIcon },
  { label: "Contact Us", href: "#", icon: LocationIcon },
  { label: "FAQs", href: "/faq", icon: HelpIcon },
  { label: "List Your Property", href: "/list-property", icon: BuildingIcon },
]

// Support links data
const supportLinks = [
  { label: "Help Center", href: "/help", icon: HelpIcon },
  { label: "Cancellation Policy", href: "/cancellation", icon: LocationIcon },
  { label: "Safety Resources", href: "/safety", icon: ShieldIcon },
  { label: "Accessibility", href: "/accessibility", icon: SparklesIcon },
]
