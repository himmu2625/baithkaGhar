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
  
  // Use local placeholder if original image fails
  const imageSrc = error ? '/placeholder.svg' : src;
  
  return (
    <div className={`relative overflow-hidden ${className || ''}`} style={{ width, height }}>
      <Image
        src={imageSrc}
        alt={alt}
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