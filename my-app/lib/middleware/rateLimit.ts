import { NextApiRequest, NextApiResponse } from 'next';

// In-memory store for rate limiting (in production, use Redis)
const rateLimits = new Map<string, number[]>();

export function rateLimitMiddleware(
  limit: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    return new Promise<void>((resolve, reject) => {
      try {
        // Use IP address or user ID as identifier
        const clientId = req.headers['x-forwarded-for'] as string || 
                        req.headers['x-real-ip'] as string ||
                        req.connection.remoteAddress ||
                        'unknown';
        
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Get or create request history for this client
        if (!rateLimits.has(clientId)) {
          rateLimits.set(clientId, []);
        }
        
        const requests = rateLimits.get(clientId)!;
        
        // Remove requests outside the current window
        const recentRequests = requests.filter(timestamp => timestamp > windowStart);
        
        if (recentRequests.length >= limit) {
          res.status(429).json({
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests, please try again later',
              retryAfter: Math.ceil(windowMs / 1000)
            }
          });
          return reject();
        }
        
        // Add current request timestamp
        recentRequests.push(now);
        rateLimits.set(clientId, recentRequests);
        
        // Set rate limit headers
        res.setHeader('X-RateLimit-Limit', limit.toString());
        res.setHeader('X-RateLimit-Remaining', (limit - recentRequests.length).toString());
        res.setHeader('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
        
        next();
        resolve();
      } catch (error) {
        console.error('Rate limit middleware error:', error);
        next(); // Continue on error to avoid blocking requests
        resolve();
      }
    });
  };
}

// Clean up old entries periodically (in production, this would be handled by Redis TTL)
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  
  for (const [clientId, requests] of Array.from(rateLimits.entries())) {
    const recentRequests = requests.filter((timestamp: number) => timestamp > oneHourAgo);
    if (recentRequests.length === 0) {
      rateLimits.delete(clientId);
    } else {
      rateLimits.set(clientId, recentRequests);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes