"use client"

import { usePathname } from "next/navigation"
import { ReactNode, useEffect, useState } from "react"

interface RouteDetectorProps {
  children: ReactNode
  osChildren: ReactNode
}

export function RouteDetector({ children, osChildren }: RouteDetectorProps) {
  const pathname = usePathname()
  const [isOSRoute, setIsOSRoute] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const isOS = pathname?.startsWith("/os") || false
    setIsOSRoute(isOS)

    // Debug logging
    console.log("RouteDetector:", {
      pathname,
      isOSRoute: isOS,
      isClient: true,
    })
  }, [pathname])

  // Show loading state while client-side hydration is happening
  if (!isClient) {
    // During server-side rendering, we need to check the pathname directly
    // to ensure OS routes get the correct layout from the start
    if (pathname?.startsWith("/os")) {
      return <>{osChildren}</>
    }
    return <>{children}</>
  }

  if (isOSRoute) {
    console.log("RouteDetector: Rendering OS layout")
    return <>{osChildren}</>
  }

  console.log("RouteDetector: Rendering main website layout")
  return <>{children}</>
}
