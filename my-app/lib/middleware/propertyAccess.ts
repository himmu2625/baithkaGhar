import { AuthenticatedRequest } from './auth';
import { NextApiResponse } from 'next';

export function propertyAccessMiddleware(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) {
  return new Promise<void>((resolve, reject) => {
    try {
      const { propertyId } = req.query;
      
      if (!propertyId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_PROPERTY_ID',
            message: 'Property ID is required'
          }
        });
        return reject();
      }

      if (!req.user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required for property access'
          }
        });
        return reject();
      }

      if (req.user.propertyId !== propertyId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'PROPERTY_ACCESS_DENIED',
            message: 'Access denied to this property'
          }
        });
        return reject();
      }

      next();
      resolve();
    } catch (error) {
      console.error('Property access middleware error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error'
        }
      });
      reject();
    }
  });
}