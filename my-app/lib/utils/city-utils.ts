/**
 * Utility functions for city name handling
 */

/**
 * Normalize city name to proper title case
 * @param cityName - The city name to normalize
 * @returns Normalized city name in title case
 */
export function normalizeCityName(cityName: string): string {
  if (!cityName || typeof cityName !== 'string') {
    return '';
  }
  
  // Extract just the city name (before comma) and normalize spaces
  const cityOnly = cityName.trim().split(',')[0].trim();
  
  // Convert to title case
  return cityOnly
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Check if two city names are equivalent (case-insensitive)
 * @param city1 - First city name
 * @param city2 - Second city name
 * @returns True if cities are equivalent
 */
export function areCitiesEquivalent(city1: string, city2: string): boolean {
  if (!city1 || !city2) return false;
  // Extract just the city names (before commas) and compare
  const city1Only = city1.trim().split(',')[0].trim().toLowerCase();
  const city2Only = city2.trim().split(',')[0].trim().toLowerCase();
  return city1Only === city2Only;
}

/**
 * Get case-insensitive regex for city matching
 * @param cityName - The city name to create regex for
 * @returns RegExp for case-insensitive matching
 */
export function getCityRegex(cityName: string): RegExp {
  // Extract just the city name (before any comma or state info)
  const cityOnly = cityName.trim().split(',')[0].trim();
  const normalizedName = cityOnly.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match the city name at the start, followed by optional spaces and comma
  return new RegExp(`^${normalizedName}\\s*,?`, 'i');
} 