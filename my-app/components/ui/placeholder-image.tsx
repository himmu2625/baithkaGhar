"use client";

import Image from 'next/image';
import { useState } from 'react';

interface PlaceholderImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function PlaceholderImage({
  src,
  alt,
  width,
  height,
  className,
}: PlaceholderImageProps) {
  const [error, setError] = useState(false);
  
  // Only use valid URLs as sources, use placeholder for any other case
  const isValidSrc = src && typeof src === 'string' && src.trim() !== '';
  const imageSrc = error || !isValidSrc ? '/placeholder.svg' : src;
  
  return (
    <div className={`relative overflow-hidden ${className || ''}`} style={{ width, height }}>
      <Image
        src={imageSrc}
        alt={alt || "Image"}
        fill
        style={{ objectFit: 'cover' }}
        onError={() => setError(true)}
        sizes={`(max-width: 768px) 100vw, ${width}px`}
        loading="lazy"
        priority={false}
      />
    </div>
  );
} 