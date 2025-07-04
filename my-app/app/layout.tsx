import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { StateProvider } from "@/provider/State-provider";
import { WishlistProvider } from "@/provider/Wishlist-provider";
import { CartProvider } from "@/provider/Cart-provider";
import { PropertyDetailsProvider } from "@/provider/PropertyDetails-provider";
import { FooterProvider } from "@/provider/Footer-provider";
import { FilterProvider } from "@/provider/Filter-provider";
import { HeaderProvider } from "@/provider/Header-provider";
import { BookingProvider } from "@/provider/Booking-provider";
import { CitiesProvider } from "@/provider/cities-provider";
import { ProgressBarImpl } from "@/components/ui/progress-bar";
import { Suspense } from "react";
import ClientProviders from "@/components/layout/client-providers";
import ToasterWrapper from "@/components/layout/toaster-wrapper";
import BodyClassHandler from "@/components/layout/body-class-handler";
import FooterWrapper from "@/components/layout/footer-wrapper";
import { ErrorBoundary } from "@/components/common/error-boundary";
import { Metadata } from "next";

// Optimize font loading
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  fallback: [
    "-apple-system",
    "BlinkMacSystemFont",
    "Segoe UI",
    "Roboto",
    "Oxygen",
    "Ubuntu",
    "sans-serif",
  ],
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: {
    default: "Baithaka GHAR",
    template: "%s | Baithaka GHAR",
  },
  description: "Baithka Ghar aims to create a platform that provides affordable and reliable accommodation that travelers can book instantly. Baithka Ghar has also developed skills in customer relationship management, strategic partnerships and leadership while expanding its presence in some states of India. Baithkha Ghar's mission is to make it the most preferred hospitality brand in India.",
  openGraph: {
    title: "Baithaka GHAR",
    description: "Baithka Ghar aims to create a platform that provides affordable and reliable accommodation that travelers can book instantly. Baithka Ghar has also developed skills in customer relationship management, strategic partnerships and leadership while expanding its presence in some states of India. Baithkha Ghar's mission is to make it the most preferred hospitality brand in India.",
    type: "website",
    locale: "en_US",
    siteName: "Baithaka GHAR"
  },
  twitter: {
    card: "summary_large_image",
    title: "Baithaka GHAR",
    description: "Baithka Ghar aims to create a platform that provides affordable and reliable accommodation that travelers can book instantly. Baithka Ghar has also developed skills in customer relationship management, strategic partnerships and leadership while expanding its presence in some states of India. Baithkha Ghar's mission is to make it the most preferred hospitality brand in India."
  },
  icons: {
    icon: [
      {
        url: '/Logo-header.svg',
        sizes: '32x32',
        type: 'image/svg+xml'
      },
      {
        url: '/Logo-header.svg',
        sizes: '48x48',
        type: 'image/svg+xml'
      }
    ],
    apple: {
      url: '/Logo-header.svg',
      sizes: '180x180',
      type: 'image/svg+xml'
    }
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to critical domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://res.cloudinary.com" />

        {/* Preload critical assets */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />

        {/* Add manifest for PWA support */}
        <link rel="manifest" href="/manifest.json" />

        {/* Add critical CSS inlining hint */}
        <meta name="next-size-adjust" content="true" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <ClientProviders>
            <BodyClassHandler />
            <Suspense fallback={null}>
              <ProgressBarImpl />
            </Suspense>
            <CitiesProvider>
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
                                <FooterWrapper />
                              </div>
                              <ToasterWrapper />
                            </BookingProvider>
                          </FilterProvider>
                        </FooterProvider>
                      </PropertyDetailsProvider>
                    </CartProvider>
                  </WishlistProvider>
                </StateProvider>
              </HeaderProvider>
            </CitiesProvider>
          </ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
