// Client-side version of search tracking that uses API endpoints
import { type Session } from 'next-auth'

/**
 * Interface defining the search parameters
 */
interface SearchParams {
  searchTerm: string
  location?: string
  checkIn?: string
  checkOut?: string
  guests?: number
}

// Track requests in memory to prevent duplication within a session
const trackedRequests = new Set<string>();

// Helper to create a unique key for a search
function getTrackingKey(searchParams: SearchParams, type: string): string {
  return `${type}-${searchParams.searchTerm}-${searchParams.location || ''}-${searchParams.checkIn || ''}-${searchParams.checkOut || ''}-${searchParams.guests || ''}`;
}

/**
 * Track a property search, especially when the property is not found
 */
export async function trackPropertySearch(
  searchParams: SearchParams,
  session?: Session | null
): Promise<void> {
  if (!searchParams.searchTerm) return;
  
  // Create a unique key for this tracking request
  const trackingKey = getTrackingKey(searchParams, 'not-found');
  
  // Skip if we've already tracked this in the current session
  if (trackedRequests.has(trackingKey)) {
    return;
  }
  
  // Mark as tracked before the request to prevent duplicates
  trackedRequests.add(trackingKey);

  try {
    // Call the API endpoint to track the search
    const response = await fetch('/api/analytics/track-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchTerm: searchParams.searchTerm,
        location: searchParams.location,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: searchParams.guests,
        hasResults: false,
        resultCount: 0
      }),
    });
    
    if (!response.ok) {
      console.error('Error tracking property search:', await response.text());
      // Remove from tracked if the server rejected it
      trackedRequests.delete(trackingKey);
    }
  } catch (error) {
    console.error('Error tracking property search:', error);
    // Remove from tracked on error to allow retry
    trackedRequests.delete(trackingKey);
  }
}

/**
 * Track a property search regardless of whether the property exists
 */
export async function trackAllSearches(
  searchParams: SearchParams,
  hasResults: boolean,
  resultCount: number,
  session?: Session | null
): Promise<void> {
  if (!searchParams.searchTerm) return;
  
  // Create a unique key for this tracking request
  const trackingKey = getTrackingKey(searchParams, hasResults ? 'found' : 'not-found');
  
  // Skip if we've already tracked this in the current session
  if (trackedRequests.has(trackingKey)) {
    return;
  }
  
  // Mark as tracked immediately to prevent duplicates
  trackedRequests.add(trackingKey);

  try {
    // Call the API endpoint to track the search
    const response = await fetch('/api/analytics/track-search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        searchTerm: searchParams.searchTerm,
        location: searchParams.location,
        checkIn: searchParams.checkIn,
        checkOut: searchParams.checkOut,
        guests: searchParams.guests,
        hasResults,
        resultCount
      }),
    });
    
    if (!response.ok) {
      console.error('Error tracking search analytics:', await response.text());
      // Remove from tracked if the server rejected it
      trackedRequests.delete(trackingKey);
    }
  } catch (error) {
    console.error('Error tracking search analytics:', error);
    // Remove from tracked on error to allow retry
    trackedRequests.delete(trackingKey);
  }
}
