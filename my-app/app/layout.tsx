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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
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

        {/* Add critical CSS inlining hint */}
        <meta name="next-size-adjust" content="true" />
      </head>
      <body className={inter.className}>
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
      </body>
    </html>
  );
}
