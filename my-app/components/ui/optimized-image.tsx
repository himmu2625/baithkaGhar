"use client"

import Image from "next/image"
import { useState } from "react"

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
  fill?: boolean
  sizes?: string
  quality?: number
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down"
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = "",
  fill = false,
  sizes,
  quality = 75,
  objectFit = "cover",
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Fallback placeholder
  const placeholderDataURL =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="

  if (hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">Image not available</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        sizes={sizes || "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
        quality={quality}
        loading={priority ? "eager" : "lazy"}
        placeholder="blur"
        blurDataURL={placeholderDataURL}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false)
          setHasError(true)
        }}
        className={`transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        style={{ objectFit }}
      />
    </div>
  )
}

// Export a variant for hero/banner images that need higher quality
export function HeroImage(props: OptimizedImageProps) {
  return <OptimizedImage {...props} priority quality={85} />
}

// Export a variant for thumbnails that need lower quality
export function ThumbnailImage(props: OptimizedImageProps) {
  return <OptimizedImage {...props} quality={60} />
}
