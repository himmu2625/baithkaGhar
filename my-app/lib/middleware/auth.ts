import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';
import StaffMember from '../../models/StaffMember';
import dbConnect from '../utils/dbConnect';

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    role: string;
    propertyId: string;
    permissions: string[];
    fullName: string;
    employeeId: string;
  };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) {
  return new Promise<void>(async (resolve, reject) => {
    try {
      await dbConnect();
      
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        res.status(401).json({
          success: false,
          error: {
            code: 'NO_TOKEN',
            message: 'Access token is required'
          }
        });
        return reject();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // Fetch fresh user data with permissions
      const user = await StaffMember.findById(decoded.id).select(
        'personalInfo.firstName personalInfo.lastName personalInfo.email employment.role access.permissions propertyId employeeId access.isActive status'
      );

      if (!user || !user.access?.isActive || user.status !== 'active') {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_USER',
            message: 'User account is inactive or not found'
          }
        });
        return reject();
      }

      req.user = {
        id: user._id.toString(),
        email: user.personalInfo?.email || '',
        role: user.employment?.role || '',
        propertyId: user.propertyId,
        permissions: user.access?.permissions || [],
        fullName: `${user.personalInfo?.firstName} ${user.personalInfo?.lastName}`.trim(),
        employeeId: user.employeeId
      };
      
      next();
      resolve();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired token'
        }
      });
      reject();
    }
  });
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) {
  return new Promise<void>(async (resolve) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        next();
        return resolve();
      }

      await dbConnect();
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await StaffMember.findById(decoded.id).select(
        'personalInfo.firstName personalInfo.lastName personalInfo.email employment.role access.permissions propertyId employeeId'
      );

      if (user && user.access?.isActive) {
        req.user = {
          id: user._id.toString(),
          email: user.personalInfo?.email || '',
          role: user.employment?.role || '',
          propertyId: user.propertyId,
          permissions: user.access?.permissions || [],
          fullName: `${user.personalInfo?.firstName} ${user.personalInfo?.lastName}`.trim(),
          employeeId: user.employeeId
        };
      }
    } catch (error) {
      // Ignore auth errors for optional auth
    }
    
    next();
    resolve();
  });
}