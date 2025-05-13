import { cloudinary } from '../services/cloudinary';

/**
 * Utility functions for handling images
 */

// Image types allowed for upload
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

// Maximum image size in bytes (5MB)
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// Default image placeholder
export const DEFAULT_IMAGE_PLACEHOLDER = 'https://res.cloudinary.com/baithaka/image/upload/v1/placeholders/property-placeholder';

/**
 * Check if a file is a valid image
 * @param file - The file to check
 * @returns True if valid, false otherwise
 */
export function isValidImage(file: File): boolean {
  return ALLOWED_IMAGE_TYPES.includes(file.type) && file.size <= MAX_IMAGE_SIZE;
}

/**
 * Generate Cloudinary URL from public ID
 * @param publicId - Cloudinary public ID
 * @param options - Transformation options
 * @returns Full Cloudinary URL
 */
export function getImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: number;
    format?: string;
    effect?: string;
  } = {}
): string {
  // Default to webp format for better compression
  const format = options.format || 'webp';
  const quality = options.quality || 80;
  
  // Apply transformations
  let transformation = '';
  
  if (options.width) {
    transformation += `w_${options.width},`;
  }
  
  if (options.height) {
    transformation += `h_${options.height},`;
  }
  
  if (options.crop) {
    transformation += `c_${options.crop},`;
  }
  
  if (options.effect) {
    transformation += `e_${options.effect},`;
  }
  
  transformation += `q_${quality},f_${format}`;
  
  // Return full URL
  return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${transformation}/${publicId}`;
}

/**
 * Get responsive image srcSet for different viewport sizes
 * @param publicId - Cloudinary public ID
 * @param options - Basic options to apply to all sizes
 * @returns srcSet string for use in <img> tag
 */
export function getImageSrcSet(
  publicId: string,
  options: {
    widths?: number[];
    format?: string;
    quality?: number;
    crop?: string;
  } = {}
): string {
  const widths = options.widths || [640, 768, 1024, 1280, 1536];
  const format = options.format || 'webp';
  const quality = options.quality || 80;
  const crop = options.crop || 'fill';
  
  return widths
    .map((width) => {
      const url = getImageUrl(publicId, {
        width,
        crop,
        format,
        quality,
      });
      return `${url} ${width}w`;
    })
    .join(', ');
}

/**
 * Build responsive sizes attribute for <img> tag
 * @param options - Breakpoints and sizes
 * @returns sizes attribute string
 */
export function getImageSizes(
  options: {
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
    '2xl'?: string;
    default: string;
  }
): string {
  const { sm, md, lg, xl } = options;
  
  let sizes = '';
  
  if (sm) sizes += `(max-width: 640px) ${sm}, `;
  if (md) sizes += `(max-width: 768px) ${md}, `;
  if (lg) sizes += `(max-width: 1024px) ${lg}, `;
  if (xl) sizes += `(max-width: 1280px) ${xl}, `;
  if (options['2xl']) sizes += `(max-width: 1536px) ${options['2xl']}, `;
  
  sizes += options.default;
  
  return sizes;
}

/**
 * Get a blurred placeholder image URL
 * @param publicId - Cloudinary public ID
 * @returns URL for a low-quality placeholder image
 */
export function getBlurredPlaceholder(publicId: string): string {
  return getImageUrl(publicId, {
    width: 20,
    height: 20,
    crop: 'fill',
    effect: 'blur:1000',
    quality: 30,
  });
}

/**
 * Returns a valid image URL or a placeholder if the provided URL is invalid
 * @param url The image URL to check
 * @param fallback Optional custom fallback URL (defaults to placeholder.svg)
 * @returns A valid image URL
 */
export function getValidImageUrl(url?: string | null, fallback: string = '/placeholder.svg'): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }
  
  // Check if the URL is from Unsplash (which might be causing issues)
  if (url.includes('unsplash.com')) {
    return fallback;
  }
  
  return url;
} 