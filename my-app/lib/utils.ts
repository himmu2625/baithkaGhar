import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a property type with proper capitalization
 * @param type The property type string to format
 * @returns The formatted property type
 */
export function formatPropertyType(type: string | undefined | null): string {
  if (!type) return 'Property';
  
  // Capitalize the first letter and lowercase the rest
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
}
