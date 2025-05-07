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

// Dynamically import client-only components with ssr disabled
const ClientToaster = dynamic(() => import("@/components/ui/client-toaster"), {
  ssr: false,
  loading: () => null,
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
      <body className={`${inter.className} initial-load`}>
        <Script id="handle-page-transitions" strategy="beforeInteractive">
          {`
            // Improved hydration handling
            if (typeof window !== 'undefined') {
              const body = document.body;
              body.classList.remove('initial-load');
              body.classList.add('loaded');
            }
          `}
        </Script>

        <ClientProviders>
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
                          <div className="min-h-screen">
                            <Header />
                            <main className="min-h-screen transition-opacity duration-300 ease-in-out">
                              {children}
                            </main>
                            <Footer />
                          </div>
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
