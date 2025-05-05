import type { Metadata, Viewport } from 'next'

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'Baithaka GHAR',
    template: '%s | Baithaka GHAR',
  },
  description: 'Find your perfect vacation home with Baithaka GHAR',
  icons: {
    icon: '/favicon.ico',
  },
} 