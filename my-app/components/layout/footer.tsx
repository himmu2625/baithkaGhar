"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation";
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
  Youtube
} from "lucide-react"
import { motion } from "framer-motion"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function Footer() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const handleNavigation = (path: string) => {
    try {
      // Using try-catch to handle any navigation errors
      router.push(path);
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback to window.location if router fails
      window.location.href = path;
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };
  
  return (
    <footer className="bg-darkGreen text-lightYellow relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-lightGreen/20 via-lightGreen to-lightGreen/20"></div>
      <div className="absolute -top-12 right-20 w-24 h-24 rounded-full bg-lightGreen/10 blur-xl"></div>
      <div className="absolute bottom-20 left-10 w-32 h-32 rounded-full bg-lightGreen/10 blur-xl"></div>
      
      <div className="container mx-auto px-3 xs:px-4 py-8 xs:py-10 sm:py-12 relative z-10">
        {/* Main footer content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-6 xs:gap-8 md:gap-6 mb-6 xs:mb-8 sm:mb-10">
          {/* Company info and social - 3 columns on md+ */}
          <div className="md:col-span-3">
            <div className="mb-4 xs:mb-6">
              <Link href="/" className="text-xl xs:text-2xl font-bold flex items-center gap-1.5 xs:gap-2 group mb-2 xs:mb-3">
                <Sparkles className="h-5 w-5 xs:h-6 xs:w-6 text-lightGreen group-hover:animate-pulse-light transition-all duration-300" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-lightYellow to-lightGreen">Baithaka Ghar</span>
              </Link>
              <p className="text-lightYellow/80 mb-3 xs:mb-4 max-w-md text-sm xs:text-base">
                Experience premium stays across India with Baithaka Ghar. 
                We offer exceptional accommodations with a focus on comfort, convenience, and unforgettable experiences.
              </p>

              {/* Newsletter subscription */}
              <div className="mt-4 xs:mt-6">
                <h4 className="text-base xs:text-lg font-semibold mb-2 xs:mb-3 text-lightGreen">Subscribe to Our Newsletter</h4>
                <form onSubmit={handleSubscribe} className="flex flex-col xs:flex-row gap-2">
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

            <div className="flex space-x-2 xs:space-x-4">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-darkGreen/80 p-1.5 xs:p-2 rounded-full border border-lightGreen/30 text-lightGreen hover:text-darkGreen hover:bg-lightGreen transition-all duration-300"
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.97 }}
                  aria-label={`Follow us on ${social.name}`}
                >
                  <social.icon className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                </motion.a>
              ))}
            </div>
          </div>
          
          {/* Quick Links - 2 columns on md+ */}
          <div className="md:col-span-2">
            <h3 className="text-base xs:text-xl font-bold mb-2 xs:mb-4 text-lightGreen flex items-center gap-1.5 xs:gap-2">
              <ArrowRight className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              Quick Links
            </h3>
            <ul className="space-y-1.5 xs:space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group flex items-center text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base"
                  >
                    <span className="mr-1.5 xs:mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <link.icon className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                    </span>
                    <span className="border-b border-transparent group-hover:border-lightGreen/30 pb-0.5">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Support Links - 2 columns on md+ */}
          <div className="md:col-span-2">
            <h3 className="text-base xs:text-xl font-bold mb-2 xs:mb-4 text-lightGreen flex items-center gap-1.5 xs:gap-2">
              <ArrowRight className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
              Support
            </h3>
            <ul className="space-y-1.5 xs:space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="group flex items-center text-lightYellow/80 hover:text-lightGreen transition-colors duration-300 text-sm xs:text-base"
                  >
                    <span className="mr-1.5 xs:mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <link.icon className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
                    </span>
                    <span className="border-b border-transparent group-hover:border-lightGreen/30 pb-0.5">
                      {link.label}
                    </span>
                  </Link>
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
        <div className="border-t border-lightGreen/20 pt-4 xs:pt-6 flex flex-col md:flex-row md:justify-between items-center">
          <p className="text-lightYellow/70 text-xs xs:text-sm mb-3 md:mb-0">
            &copy; {new Date().getFullYear()} Baithaka Ghar. All rights reserved.
          </p>
          
          <div className="flex flex-wrap justify-center gap-3 xs:gap-4 md:gap-6 text-xs xs:text-sm text-lightYellow/70">
            <Link href="/terms" className="hover:text-lightGreen transition-colors">
              Terms of Service
            </Link>
            <Link href="/privacy" className="hover:text-lightGreen transition-colors">
              Privacy Policy
            </Link>
            <Link href="/cookies" className="hover:text-lightGreen transition-colors">
              Cookie Policy
            </Link>
            <Link
              href="/admin/login"
              className="flex items-center text-xs xs:text-sm hover:text-lightGreen transition-colors ml-1 xs:ml-2"
            >
              <Shield className="w-2.5 h-2.5 xs:w-3 xs:h-3 mr-1" />
              Admin Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

// Social media links data
const socialLinks = [
  { name: 'Facebook', icon: Facebook, url: 'https://facebook.com' },
  { name: 'Instagram', icon: Instagram, url: 'https://instagram.com' },
  { name: 'Twitter', icon: Twitter, url: 'https://twitter.com' },
  { name: 'LinkedIn', icon: Linkedin, url: 'https://linkedin.com' },
  { name: 'YouTube', icon: Youtube, url: 'https://youtube.com' }
];

// Quick links data
const quickLinks = [
  { label: 'About Us', href: '/about', icon: Sparkles },
  { label: 'Contact Us', href: '/contact', icon: MapPin },
  { label: 'FAQs', href: '/faq', icon: HelpCircle },
  { label: 'List Your Property', href: '/list-property', icon: Building },
  { label: 'Host Dashboard', href: '/host/dashboard', icon: BarChart3 },
];

// Support links data
const supportLinks = [
  { label: 'Help Center', href: '/help', icon: HelpCircle },
  { label: 'Cancellation Policy', href: '/cancellation', icon: MapPin },
  { label: 'Safety Resources', href: '/safety', icon: Shield },
  { label: 'Accessibility', href: '/accessibility', icon: Sparkles },
];
