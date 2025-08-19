"use client"

import React from "react"
import Header from "@/components/layout/header"
import FooterWrapper from "@/components/layout/footer-wrapper"
import { StateProvider } from "@/provider/State-provider"
import { WishlistProvider } from "@/provider/Wishlist-provider"
import { CartProvider } from "@/provider/Cart-provider"
import { PropertyDetailsProvider } from "@/provider/PropertyDetails-provider"
import { FooterProvider } from "@/provider/Footer-provider"
import { FilterProvider } from "@/provider/Filter-provider"
import { HeaderProvider } from "@/provider/Header-provider"
import { BookingProvider } from "@/provider/Booking-provider"
import { CitiesProvider } from "@/provider/cities-provider"

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export default function ConditionalLayout({
  children,
}: ConditionalLayoutProps) {
  const [mounted, setMounted] = React.useState(false)
  const [isOSRoute, setIsOSRoute] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    setIsOSRoute(window.location.pathname.startsWith("/os"))

    // Also listen for route changes
    const handleRouteChange = () => {
      setIsOSRoute(window.location.pathname.startsWith("/os"))
    }

    window.addEventListener("popstate", handleRouteChange)
    return () => window.removeEventListener("popstate", handleRouteChange)
  }, [])

  // During SSR, render with providers to prevent hook errors
  if (!mounted) {
    return (
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
                      </BookingProvider>
                    </FilterProvider>
                  </FooterProvider>
                </PropertyDetailsProvider>
              </CartProvider>
            </WishlistProvider>
          </StateProvider>
        </HeaderProvider>
      </CitiesProvider>
    )
  }

  if (isOSRoute) {
    // OS routes: completely isolated, no header/footer
    return (
      <div className="h-screen w-screen overflow-hidden bg-gray-50">
        {children}
      </div>
    )
  }

  // Regular website routes: full layout with header/footer
  return (
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
                    </BookingProvider>
                  </FilterProvider>
                </FooterProvider>
              </PropertyDetailsProvider>
            </CartProvider>
          </WishlistProvider>
        </StateProvider>
      </HeaderProvider>
    </CitiesProvider>
  )
}
