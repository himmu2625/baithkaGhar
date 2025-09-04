import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from './dbConnect';

type Middleware = (req: any, res: NextApiResponse, next: () => void) => Promise<void> | void;
type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export function createHandler(
  handler: Handler, 
  middlewares: Middleware[] = [],
  options: { requireDb?: boolean } = { requireDb: true }
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Set security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Set CORS headers
    const origin = req.headers.origin;
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'https://yourapp.vercel.app'
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Property-ID');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    try {
      // Connect to database if required
      if (options.requireDb) {
        await dbConnect();
      }

      // Run middleware chain
      let index = 0;
      const next = async (): Promise<void> => {
        if (index < middlewares.length) {
          const middleware = middlewares[index++];
          await middleware(req, res, next);
        } else {
          await handler(req, res);
        }
      };

      await next();
    } catch (error) {
      console.error('API Handler Error:', error);
      
      // Don't send response if already sent
      if (res.headersSent) {
        return;
      }

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: process.env.NODE_ENV === 'development' 
            ? (error as Error).message 
            : 'Something went wrong'
        }
      });
    }
  };
}

export function handleMethodNotAllowed(
  req: NextApiRequest, 
  res: NextApiResponse, 
  allowedMethods: string[]
) {
  res.setHeader('Allow', allowedMethods.join(', '));
  res.status(405).json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: `Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`
    }
  });
}

export function createSuccessResponse(
  data: any, 
  message?: string, 
  meta?: any
) {
  const response: any = {
    success: true,
    data
  };
  
  if (message) {
    response.message = message;
  }
  
  if (meta) {
    response.meta = meta;
  }
  
  return response;
}

export function createErrorResponse(
  code: string, 
  message: string, 
  details?: any
) {
  const response: any = {
    success: false,
    error: {
      code,
      message
    }
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return response;
}

// Helper function to safely parse JSON
export function safeJsonParse(str: string, fallback: any = null) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

// Helper function to sanitize user input
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim();
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  return input;
}

// Default export as apiHandler for compatibility
export const apiHandler = createHandler;