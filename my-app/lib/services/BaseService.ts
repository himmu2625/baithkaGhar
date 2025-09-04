import { Model, Document, FilterQuery, UpdateQuery } from 'mongoose';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: string;
  populate?: string | string[];
}

export interface PaginationResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export class BaseService<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findAll(
    filters: FilterQuery<T> = {}, 
    options: PaginationOptions = {}
  ): Promise<PaginationResult<T>> {
    const { 
      page = 1, 
      limit = 20, 
      sort = '-createdAt', 
      populate = '' 
    } = options;
    
    const skip = (page - 1) * limit;

    let query = this.model.find(filters);
    
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(pop => query = query.populate(pop));
      } else {
        query = query.populate(populate);
      }
    }

    const [items, total] = await Promise.all([
      query.sort(sort).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filters)
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items,
      meta: {
        total,
        page: parseInt(page.toString()),
        per_page: parseInt(limit.toString()),
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      }
    };
  }

  async findById(id: string, populate?: string | string[]): Promise<T | null> {
    let query = this.model.findById(id);
    
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(pop => query = query.populate(pop));
      } else {
        query = query.populate(populate);
      }
    }

    return await query.exec();
  }

  async findOne(filters: FilterQuery<T>, populate?: string | string[]): Promise<T | null> {
    let query = this.model.findOne(filters);
    
    if (populate) {
      if (Array.isArray(populate)) {
        populate.forEach(pop => query = query.populate(pop));
      } else {
        query = query.populate(populate);
      }
    }

    return await query.exec();
  }

  async create(data: Partial<T>): Promise<T> {
    const item = new this.model(data);
    return await item.save();
  }

  async createMany(data: Partial<T>[]): Promise<T[]> {
    const result = await this.model.insertMany(data);
    return result as T[];
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    return await this.model.findByIdAndUpdate(
      id, 
      data, 
      { 
        new: true, 
        runValidators: true 
      }
    ).exec();
  }

  async updateMany(
    filters: FilterQuery<T>, 
    data: UpdateQuery<T>
  ): Promise<{ matchedCount: number; modifiedCount: number }> {
    const result = await this.model.updateMany(filters, data);
    return {
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount
    };
  }

  async delete(id: string): Promise<T | null> {
    return await this.model.findByIdAndDelete(id).exec();
  }

  async deleteMany(filters: FilterQuery<T>): Promise<{ deletedCount: number }> {
    const result = await this.model.deleteMany(filters);
    return { deletedCount: result.deletedCount };
  }

  async exists(filters: FilterQuery<T>): Promise<boolean> {
    const doc = await this.model.exists(filters);
    return !!doc;
  }

  async count(filters: FilterQuery<T> = {}): Promise<number> {
    return await this.model.countDocuments(filters);
  }

  async aggregate(pipeline: any[]): Promise<any[]> {
    return await this.model.aggregate(pipeline).exec();
  }

  // Bulk operations
  async bulkUpdate(operations: Array<{
    filter: FilterQuery<T>;
    update: UpdateQuery<T>;
  }>): Promise<void> {
    const bulkOps = operations.map(op => ({
      updateOne: {
        filter: op.filter,
        update: op.update,
        upsert: false
      }
    }));

    await this.model.bulkWrite(bulkOps as any);
  }

  // Search functionality
  async search(
    searchTerm: string, 
    searchFields: string[], 
    filters: FilterQuery<T> = {},
    options: PaginationOptions = {}
  ): Promise<PaginationResult<T>> {
    const searchQuery = {
      ...filters,
      $or: searchFields.map(field => ({
        [field]: { $regex: searchTerm, $options: 'i' }
      }))
    };

    return await this.findAll(searchQuery, options);
  }

  // Helper method to build filters from query parameters
  protected buildFilters(queryParams: any, propertyId?: string): FilterQuery<T> {
    const filters: any = {};
    
    if (propertyId) {
      filters.propertyId = propertyId;
    }

    // Common filters
    if (queryParams.status) {
      filters.status = queryParams.status;
    }
    
    if (queryParams.isActive !== undefined) {
      filters.isActive = queryParams.isActive === 'true';
    }

    // Date range filters
    if (queryParams.date_from || queryParams.date_to) {
      filters.createdAt = {};
      if (queryParams.date_from) {
        filters.createdAt.$gte = new Date(queryParams.date_from);
      }
      if (queryParams.date_to) {
        filters.createdAt.$lte = new Date(queryParams.date_to);
      }
    }

    // Numeric range filters
    if (queryParams.price_min || queryParams.price_max) {
      filters.price = {};
      if (queryParams.price_min) {
        filters.price.$gte = parseFloat(queryParams.price_min);
      }
      if (queryParams.price_max) {
        filters.price.$lte = parseFloat(queryParams.price_max);
      }
    }

    return filters;
  }

  // Helper method to build sort options
  protected buildSortOptions(sortParam?: string): string {
    if (!sortParam) return '-createdAt';
    
    const validSortFields = [
      'createdAt', 'updatedAt', 'name', 'price', 'status', 
      'displayOrder', 'rating', 'popularity'
    ];
    
    const sortField = sortParam.replace(/^-/, '');
    const sortOrder = sortParam.startsWith('-') ? '-' : '';
    
    if (validSortFields.includes(sortField)) {
      return sortOrder + sortField;
    }
    
    return '-createdAt';
  }
}