import { Inter, Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { ProgressBarImpl } from "@/components/ui/progress-bar"
import { Suspense } from "react"
import ClientProviders from "@/components/layout/client-providers"
import ToasterWrapper from "@/components/layout/toaster-wrapper"
import BodyClassHandler from "@/components/layout/body-class-handler"
import { ErrorBoundary } from "@/components/common/error-boundary"
import { Metadata } from "next"
import ConditionalLayout from "@/components/layout/conditional-layout"
import { ServiceWorkerRegister } from "@/components/common/service-worker-register"

// Optimize font loading
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-inter",
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
})

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  variable: "--font-heading",
  fallback: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    "sans-serif",
  ],
  adjustFontFallback: true,
})

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_BASE_URL || "https://baithakaghar.com"
  ),
  title: {
    default: "Baithaka Ghar: Affordable & Reliable Accommodation in India",
    template: "%s | Baithaka Ghar",
  },
  description:
    "Find and book affordable and reliable accommodation across India with Baithaka Ghar. We offer a wide range of properties for travelers, ensuring a comfortable and memorable stay.",
  keywords: ["accommodation", "hotels", "travel", "India", "booking", "vacation rentals", "affordable stays"],
  openGraph: {
    title: "Baithaka Ghar: Affordable & Reliable Accommodation in India",
    description:
      "Find and book affordable and reliable accommodation across India with Baithaka Ghar. We offer a wide range of properties for travelers, ensuring a comfortable and memorable stay.",
    type: "website",
    locale: "en_US",
    siteName: "Baithaka Ghar",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Baithaka Ghar - Affordable & Reliable Accommodation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Baithaka Ghar: Affordable & Reliable Accommodation in India",
    description:
      "Find and book affordable and reliable accommodation across India with Baithaka Ghar. We offer a wide range of properties for travelers, ensuring a comfortable and memorable stay.",
    images: ["/twitter-image.png"],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://www.baithakaghar.com/",
              "name": "Baithaka Ghar",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.baithakaghar.com/search?location={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        {/* Preconnect to critical domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://images.pexels.com" />

        {/* DNS prefetch for other domains */}
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://images.pexels.com" />

        {/* Add manifest for PWA support */}
        <link rel="manifest" href="/manifest.json" />

        {/* Add critical CSS inlining hint */}
        <meta name="next-size-adjust" content="true" />
      </head>
      <body className={`${inter.variable} ${plusJakartaSans.variable} font-sans antialiased`}>
        <ErrorBoundary>
          <ClientProviders>
            <ServiceWorkerRegister />
            <BodyClassHandler />
            <Suspense fallback={null}>
              <ProgressBarImpl />
            </Suspense>
            <ConditionalLayout>{children}</ConditionalLayout>
            <ToasterWrapper />
          </ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  )
}
