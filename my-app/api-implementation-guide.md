# API Implementation Guide

## Project Structure
```
my-app/
├── pages/api/v1/
│   └── properties/
│       └── [propertyId]/
│           ├── fb/
│           │   ├── menu/
│           │   │   ├── categories/
│           │   │   ├── items/
│           │   │   └── modifiers/
│           │   ├── orders/
│           │   ├── tables/
│           │   ├── reservations/
│           │   ├── kitchens/
│           │   ├── inventory/
│           │   ├── recipes/
│           │   └── reports/
│           └── events/
│               ├── bookings/
│               ├── venues/
│               ├── packages/
│               ├── services/
│               ├── equipment/
│               ├── timeline/
│               ├── staff/
│               ├── menus/
│               ├── invoices/
│               ├── types/
│               └── reports/
├── lib/
│   ├── middleware/
│   ├── services/
│   ├── utils/
│   └── validations/
└── models/
```

## Middleware Implementation

### 1. Authentication Middleware
```typescript
// lib/middleware/auth.ts
import jwt from 'jsonwebtoken';
import { NextApiRequest, NextApiResponse } from 'next';

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    role: string;
    propertyId: string;
    permissions: string[];
  };
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Access token is required'
        }
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      }
    });
  }
}
```

### 2. Property Access Middleware
```typescript
// lib/middleware/propertyAccess.ts
import { AuthenticatedRequest } from './auth';
import { NextApiResponse } from 'next';

export function propertyAccessMiddleware(
  req: AuthenticatedRequest,
  res: NextApiResponse,
  next: () => void
) {
  const { propertyId } = req.query;
  
  if (!propertyId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_PROPERTY_ID',
        message: 'Property ID is required'
      }
    });
  }

  if (req.user.propertyId !== propertyId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'PROPERTY_ACCESS_DENIED',
        message: 'Access denied to this property'
      }
    });
  }

  next();
}
```

### 3. Permission Middleware
```typescript
// lib/middleware/permissions.ts
import { AuthenticatedRequest } from './auth';
import { NextApiResponse } from 'next';

export function requirePermission(permission: string) {
  return (req: AuthenticatedRequest, res: NextApiResponse, next: () => void) => {
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Permission '${permission}' is required`
        }
      });
    }
    next();
  };
}

// Usage examples:
// requirePermission('manage_menu')
// requirePermission('view_orders')
// requirePermission('manage_events')
```

### 4. Rate Limiting Middleware
```typescript
// lib/middleware/rateLimit.ts
import { NextApiRequest, NextApiResponse } from 'next';

const rateLimits = new Map();

export function rateLimitMiddleware(
  limit: number = 100,
  windowMs: number = 60 * 1000 // 1 minute
) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const clientId = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimits.has(clientId)) {
      rateLimits.set(clientId, []);
    }
    
    const requests = rateLimits.get(clientId);
    const recentRequests = requests.filter((timestamp: number) => timestamp > windowStart);
    
    if (recentRequests.length >= limit) {
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests, please try again later'
        }
      });
    }
    
    recentRequests.push(now);
    rateLimits.set(clientId, recentRequests);
    next();
  };
}
```

### 5. Validation Middleware
```typescript
// lib/middleware/validation.ts
import Joi from 'joi';
import { NextApiRequest, NextApiResponse } from 'next';

export function validateBody(schema: Joi.ObjectSchema) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }
    
    next();
  };
}

export function validateQuery(schema: Joi.ObjectSchema) {
  return (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
    const { error } = schema.validate(req.query);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'QUERY_VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message
          }))
        }
      });
    }
    
    next();
  };
}
```

## Service Layer Implementation

### 1. Base Service Class
```typescript
// lib/services/BaseService.ts
import { Model } from 'mongoose';

export class BaseService<T> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findAll(filters: any = {}, options: any = {}) {
    const { page = 1, limit = 20, sort = '-createdAt' } = options;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.model.find(filters).sort(sort).skip(skip).limit(limit),
      this.model.countDocuments(filters)
    ]);

    return {
      items,
      meta: {
        total,
        page: parseInt(page),
        per_page: parseInt(limit),
        total_pages: Math.ceil(total / limit)
      }
    };
  }

  async findById(id: string) {
    return await this.model.findById(id);
  }

  async create(data: Partial<T>) {
    return await this.model.create(data);
  }

  async update(id: string, data: Partial<T>) {
    return await this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string) {
    return await this.model.findByIdAndDelete(id);
  }
}
```

### 2. Menu Service Example
```typescript
// lib/services/MenuService.ts
import { BaseService } from './BaseService';
import MenuItem from '../models/MenuItem';

export class MenuService extends BaseService<any> {
  constructor() {
    super(MenuItem);
  }

  async findByCategory(propertyId: string, categoryId: string) {
    return await this.model.findByCategory(propertyId, categoryId);
  }

  async findAvailable(propertyId: string) {
    return await this.model.findAvailable(propertyId);
  }

  async updateStock(itemId: string, quantity: number) {
    const item = await this.model.findById(itemId);
    if (item) {
      return await item.updateStock(quantity);
    }
    throw new Error('Item not found');
  }

  async addRating(itemId: string, rating: number) {
    const item = await this.model.findById(itemId);
    if (item) {
      return await item.addRating(rating);
    }
    throw new Error('Item not found');
  }
}
```

## API Endpoint Implementation Examples

### 1. Menu Items CRUD
```typescript
// pages/api/v1/properties/[propertyId]/fb/menu/items/index.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware, propertyAccessMiddleware, requirePermission } from '../../../../../lib/middleware';
import { MenuService } from '../../../../../lib/services/MenuService';
import { createHandler } from '../../../../../lib/utils/apiHandler';

const menuService = new MenuService();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  const { propertyId } = req.query;

  switch (method) {
    case 'GET':
      try {
        const {
          page = 1,
          limit = 20,
          category,
          available,
          dietary,
          search,
          price_min,
          price_max
        } = req.query;

        const filters: any = { propertyId };

        if (category) filters.categoryId = category;
        if (available) filters['availability.isActive'] = true;
        if (dietary) filters[`dietary.${dietary}`] = true;
        if (search) {
          filters.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ];
        }
        if (price_min || price_max) {
          filters['pricing.basePrice'] = {};
          if (price_min) filters['pricing.basePrice'].$gte = parseFloat(price_min);
          if (price_max) filters['pricing.basePrice'].$lte = parseFloat(price_max);
        }

        const result = await menuService.findAll(filters, { page, limit });
        
        res.status(200).json({
          success: true,
          data: result.items,
          meta: result.meta
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch menu items'
          }
        });
      }
      break;

    case 'POST':
      try {
        const menuItem = await menuService.create({
          ...req.body,
          propertyId,
          createdBy: req.user.id
        });

        res.status(201).json({
          success: true,
          data: menuItem,
          message: 'Menu item created successfully'
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'CREATION_FAILED',
            message: 'Failed to create menu item'
          }
        });
      }
      break;

    default:
      res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Method ${method} not allowed`
        }
      });
  }
};

export default createHandler(
  handler,
  [authMiddleware, propertyAccessMiddleware, requirePermission('manage_menu')]
);
```

### 2. Dynamic Item Operations
```typescript
// pages/api/v1/properties/[propertyId]/fb/menu/items/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authMiddleware, propertyAccessMiddleware } from '../../../../../../lib/middleware';
import { MenuService } from '../../../../../../lib/services/MenuService';
import { createHandler } from '../../../../../../lib/utils/apiHandler';

const menuService = new MenuService();

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const { method } = req;
  const { id } = req.query;

  switch (method) {
    case 'GET':
      try {
        const menuItem = await menuService.findById(id as string);
        
        if (!menuItem) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Menu item not found'
            }
          });
        }

        res.status(200).json({
          success: true,
          data: menuItem
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Failed to fetch menu item'
          }
        });
      }
      break;

    case 'PUT':
      try {
        const menuItem = await menuService.update(id as string, {
          ...req.body,
          lastUpdatedBy: req.user.id
        });

        if (!menuItem) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Menu item not found'
            }
          });
        }

        res.status(200).json({
          success: true,
          data: menuItem,
          message: 'Menu item updated successfully'
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'UPDATE_FAILED',
            message: 'Failed to update menu item'
          }
        });
      }
      break;

    case 'DELETE':
      try {
        const menuItem = await menuService.delete(id as string);

        if (!menuItem) {
          return res.status(404).json({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Menu item not found'
            }
          });
        }

        res.status(200).json({
          success: true,
          message: 'Menu item deleted successfully'
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: {
            code: 'DELETE_FAILED',
            message: 'Failed to delete menu item'
          }
        });
      }
      break;

    default:
      res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Method ${method} not allowed`
        }
      });
  }
};

export default createHandler(
  handler,
  [authMiddleware, propertyAccessMiddleware]
);
```

## Utility Functions

### 1. API Handler Creator
```typescript
// lib/utils/apiHandler.ts
import { NextApiRequest, NextApiResponse } from 'next';

type Middleware = (req: any, res: NextApiResponse, next: () => void) => void;
type Handler = (req: NextApiRequest, res: NextApiResponse) => Promise<void>;

export function createHandler(handler: Handler, middlewares: Middleware[] = []) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    let index = 0;

    const next = () => {
      if (index < middlewares.length) {
        const middleware = middlewares[index++];
        middleware(req, res, next);
      } else {
        handler(req, res);
      }
    };

    next();
  };
}
```

### 2. Database Connection
```typescript
// lib/utils/dbConnect.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
```

This comprehensive API structure provides:

✅ **Complete endpoint mapping** for both F&B and Events
✅ **Middleware architecture** for auth, validation, and security
✅ **Service layer patterns** for business logic
✅ **Error handling standards** with consistent responses
✅ **Implementation examples** showing real code patterns
✅ **Security considerations** including rate limiting and permissions
✅ **Query parameter standards** for filtering and pagination
✅ **Project structure** that's scalable and maintainable

The API is now ready for Phase 2.2 development implementation!