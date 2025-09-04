import Joi from 'joi';
import { NextApiRequest, NextApiResponse } from 'next';

export function validateBody(schema: Joi.ObjectSchema) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const { error, value } = schema.validate(req.body, {
          abortEarly: false,
          stripUnknown: true
        });
        
        if (error) {
          res.status(422).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
              details: error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
              }))
            }
          });
          return reject();
        }
        
        // Replace request body with validated and sanitized data
        req.body = value;
        next();
        resolve();
      } catch (error) {
        console.error('Validation middleware error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Validation failed'
          }
        });
        reject();
      }
    });
  };
}

export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const { error, value } = schema.validate(req.query, {
          abortEarly: false,
          stripUnknown: true,
          convert: true
        });
        
        if (error) {
          res.status(400).json({
            success: false,
            error: {
              code: 'QUERY_VALIDATION_ERROR',
              message: 'Invalid query parameters',
              details: error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
                value: detail.context?.value
              }))
            }
          });
          return reject();
        }
        
        // Replace request query with validated data
        req.query = value;
        next();
        resolve();
      } catch (error) {
        console.error('Query validation middleware error:', error);
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Query validation failed'
          }
        });
        reject();
      }
    });
  };
}

// Common validation schemas
export const commonSchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    offset: Joi.number().integer().min(0)
  }),
  
  sorting: Joi.object({
    sort: Joi.string().default('-createdAt'),
    order: Joi.string().valid('asc', 'desc').default('desc')
  }),
  
  dateRange: Joi.object({
    date_from: Joi.date().iso(),
    date_to: Joi.date().iso().min(Joi.ref('date_from'))
  }),
  
  mongoId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
  
  search: Joi.object({
    search: Joi.string().trim().min(1).max(100),
    q: Joi.string().trim().min(1).max(100)
  })
};