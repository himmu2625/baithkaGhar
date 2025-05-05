import { Inter } from "next/font/google"
import "./globals.css"
import Header from "@/components/layout/header"
import Footer from "@/components/layout/footer"
import { StateProvider } from "@/provider/State-provider"
import { WishlistProvider } from "@/provider/Wishlist-provider"
import { CartProvider } from "@/provider/Cart-provider"
import { PropertyDetailsProvider } from "@/provider/PropertyDetails-provider"
import { FooterProvider } from "@/provider/Footer-provider"
import { FilterProvider } from "@/provider/Filter-provider"
import { HeaderProvider } from "@/provider/Header-provider"
import { BookingProvider } from "@/provider/Booking-provider"
import dynamic from "next/dynamic"
import { ProgressBarImpl } from "@/components/ui/progress-bar"
import { Suspense } from "react"
import ClientProviders from "@/components/layout/client-providers"
import Script from "next/script"

// Dynamically import client-only components with ssr disabled and preloading
const ClientToaster = dynamic(() => import("@/components/ui/client-toaster"), {
  ssr: false,
  loading: () => null, // Prevent flash of loading state
})

// Optimize font loading
const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'sans-serif'],
  adjustFontFallback: true,
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to critical domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://res.cloudinary.com" />

        {/* Preload critical assets */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* Add critical CSS inlining hint */}
        <meta name="next-size-adjust" content="true" />
      </head>
      <body className={inter.className}>
        {/* Quick page transition handling */}
        <Script id="handle-page-transitions" strategy="beforeInteractive">
          {`
            // Fix for hydration errors
            document.body.classList.add('hydration-error');
            window.setTimeout(function() {
              document.body.classList.remove('hydration-error');
            }, 200); // Reduced from 400ms to 200ms

            // Add page transition class
            document.addEventListener('DOMContentLoaded', function() {
              window.setTimeout(function() {
                document.body.classList.add('page-visible');
              }, 50);
            });
          `}
        </Script>

        {/* Preload images script */}
        <Script id="preload-critical-images" strategy="afterInteractive">
          {`
            // Preload critical images after initial load
            function preloadImage(url) {
              if (!url) return;
              const img = new Image();
              img.src = url;
            }

            // Preload hero and other critical images
            window.addEventListener('load', function() {
              setTimeout(function() {
                document.querySelectorAll('img[data-preload="true"]').forEach(function(img) {
                  preloadImage(img.dataset.src || img.src);
                });
              }, 1000);
            });
          `}
        </Script>

        <ClientProviders>
          {/* Wrap ProgressBar in Suspense */}
          <Suspense fallback={null}>
            <ProgressBarImpl />
          </Suspense>
          <HeaderProvider>
            <StateProvider>
              <WishlistProvider>
                <CartProvider>
                  <PropertyDetailsProvider>
                    <FooterProvider>
                      <FilterProvider>
                        <BookingProvider>
                          <Suspense fallback={
                            <div className="min-h-screen flex items-center justify-center">
                              <div className="flex flex-col items-center">
                                <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                                <p className="mt-4 text-sm font-medium">Loading your experience...</p>
                              </div>
                            </div>
                          }>
                            <Header />
                            {/* Add fade-in effect on page transitions */}
                            <main className="min-h-screen animate-fadeIn">{children}</main>
                            <Footer />
                          </Suspense>
                          <ClientToaster />
                        </BookingProvider>
                      </FilterProvider>
                    </FooterProvider>
                  </PropertyDetailsProvider>
                </CartProvider>
              </WishlistProvider>
            </StateProvider>
          </HeaderProvider>
        </ClientProviders>
      </body>
    </html>
  )
}
