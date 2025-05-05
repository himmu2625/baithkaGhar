import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Re-export from other utility files
export * from './cache';

/**
 * Merge class names with Tailwind CSS
 * @param {ClassValue[]} inputs - Class names
 * @returns {string} - Merged class names
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Format a date
 * @param {Date|string} date - Date to format
 * @param {string} format - Format string
 * @returns {string} - Formatted date
 */
export function formatDate(date: Date | string, format: string = "MMMM dd, yyyy"): string {
  if (!date) return ""
  
  const d = typeof date === "string" ? new Date(date) : date
  
  // Check if date is valid
  if (isNaN(d.getTime())) return ""
  
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  
  // Format tokens
  const tokens: Record<string, string> = {
    yyyy: d.getFullYear().toString(),
    yy: d.getFullYear().toString().slice(-2),
    MMMM: months[d.getMonth()],
    MMM: months[d.getMonth()].slice(0, 3),
    MM: (d.getMonth() + 1).toString().padStart(2, "0"),
    M: (d.getMonth() + 1).toString(),
    dddd: days[d.getDay()],
    ddd: days[d.getDay()].slice(0, 3),
    dd: d.getDate().toString().padStart(2, "0"),
    d: d.getDate().toString(),
    HH: d.getHours().toString().padStart(2, "0"),
    H: d.getHours().toString(),
    hh: (d.getHours() % 12 || 12).toString().padStart(2, "0"),
    h: (d.getHours() % 12 || 12).toString(),
    mm: d.getMinutes().toString().padStart(2, "0"),
    m: d.getMinutes().toString(),
    ss: d.getSeconds().toString().padStart(2, "0"),
    s: d.getSeconds().toString(),
    a: d.getHours() < 12 ? "am" : "pm",
    A: d.getHours() < 12 ? "AM" : "PM",
  }
  
  // Replace tokens in format string
  return format.replace(/yyyy|yy|MMMM|MMM|MM|M|dddd|ddd|dd|d|HH|H|hh|h|mm|m|ss|s|a|A/g, (match) => {
    return tokens[match] || match
  })
}

/**
 * Format a price
 * @param {number} price - Price to format
 * @param {string} currency - Currency code
 * @returns {string} - Formatted price
 */
export function formatPrice(price: number, currency: string = "INR"): string {
  if (typeof price !== "number") return ""
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Truncate a string
 * @param {string} str - String to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated string
 */
export function truncateString(str: string, length: number = 100): string {
  if (!str) return ""
  
  if (str.length <= length) return str
  
  return str.slice(0, length) + "..."
}

/**
 * Generate a random string
 * @param {number} length - Length of the string
 * @returns {string} - Random string
 */
export function generateRandomString(length: number = 10): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  
  return result
}

/**
 * Validate an email address
 * @param {string} email - Email to validate
 * @returns {boolean} - Whether the email is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate a phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Whether the phone number is valid
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\d{10}$/
  return phoneRegex.test(phone)
}

/**
 * Calculate the number of nights between two dates
 * @param {Date|string} checkIn - Check-in date
 * @param {Date|string} checkOut - Check-out date
 * @returns {number} - Number of nights
 */
export function calculateNights(checkIn: Date | string, checkOut: Date | string): number {
  if (!checkIn || !checkOut) return 0
  
  const checkInDate = typeof checkIn === "string" ? new Date(checkIn) : checkIn
  const checkOutDate = typeof checkOut === "string" ? new Date(checkOut) : checkOut
  
  // Check if dates are valid
  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) return 0
  
  const diffTime = Math.abs(checkOutDate.getTime() - checkInDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Format currency in Indian format
 */
export function formatCurrency(amount: number, locale: string = 'en-IN', currency: string = 'INR'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date range
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string, locale: string = 'en-IN'): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  // If same month and year
  if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
  }
  
  // If same year
  if (start.getFullYear() === end.getFullYear()) {
    return `${start.getDate()} ${start.toLocaleDateString(locale, { month: 'short' })} - ${end.getDate()} ${end.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`;
  }
  
  // Different years
  return `${start.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

/**
 * Generate a slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Get random elements from an array
 */
export function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Capitalize the first letter of a string
 */
export function capitalize(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
