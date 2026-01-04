/**
 * Types Index
 * Central export for all type definitions
 */

export * from './user';
export * from './property';
export * from './booking';

// Common response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
