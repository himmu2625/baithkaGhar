/**
 * Client-side API functions for the host dashboard
 */

// Fetch dashboard analytics data
export async function fetchDashboardStats(
  timeframe: "7days" | "30days" | "90days" | "year" = "30days"
) {
  const response = await fetch(`/api/host/analytics?timeframe=${timeframe}`);
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to fetch analytics data");
  }
  
  return await response.json();
}

/**
 * Tracks a property view for analytics
 */
export async function trackPropertyView(propertyId: string, visitorId: string) {
  try {
    const response = await fetch('/api/analytics/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        propertyId,
        visitorId,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to track property view')
    }

    return true
  } catch (error) {
    console.error('Error tracking property view:', error)
    return false
  }
}

// Generate price recommendations for a property
export async function getPriceRecommendations(
  propertyId: string
) {
  const response = await fetch(`/api/host/analytics/price-recommendations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      propertyId,
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to generate price recommendations");
  }
  
  return await response.json();
} 