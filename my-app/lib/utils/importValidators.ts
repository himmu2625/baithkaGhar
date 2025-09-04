import { Types } from 'mongoose';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type ValidatorFunction = (row: any, index: number) => ValidationResult;

/**
 * Validate menu item import data
 */
export const validateMenuItem: ValidatorFunction = (row, index) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!row['Item Name'] || typeof row['Item Name'] !== 'string' || row['Item Name'].trim() === '') {
    errors.push('Item Name is required');
  }

  if (!row['Base Price'] || isNaN(Number(row['Base Price'])) || Number(row['Base Price']) <= 0) {
    errors.push('Valid Base Price is required');
  }

  if (!row['Category'] || typeof row['Category'] !== 'string' || row['Category'].trim() === '') {
    errors.push('Category is required');
  }

  // Optional field validations
  if (row['Cost Price'] && (isNaN(Number(row['Cost Price'])) || Number(row['Cost Price']) < 0)) {
    errors.push('Cost Price must be a valid number');
  }

  if (row['Preparation Time (min)'] && (isNaN(Number(row['Preparation Time (min)'])) || Number(row['Preparation Time (min)']) < 0)) {
    errors.push('Preparation Time must be a valid number');
  }

  // Validate spicy level
  const validSpicyLevels = ['none', 'mild', 'medium', 'hot', 'extra_hot'];
  if (row['Spicy Level'] && !validSpicyLevels.includes(row['Spicy Level'].toLowerCase())) {
    errors.push(`Spicy Level must be one of: ${validSpicyLevels.join(', ')}`);
  }

  // Validate boolean fields
  const booleanFields = ['Vegetarian', 'Vegan', 'Gluten Free', 'Available'];
  booleanFields.forEach(field => {
    if (row[field] && !['yes', 'no', 'true', 'false', '1', '0'].includes(String(row[field]).toLowerCase())) {
      warnings.push(`${field} should be 'yes/no', 'true/false', or '1/0'`);
    }
  });

  // Warnings for best practices
  if (row['Cost Price'] && row['Base Price'] && Number(row['Cost Price']) >= Number(row['Base Price'])) {
    warnings.push('Cost Price should typically be lower than Base Price for profitability');
  }

  if (row['Description'] && row['Description'].length > 500) {
    warnings.push('Description is quite long, consider shortening it');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate category import data
 */
export const validateCategory: ValidatorFunction = (row, index) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!row['Category Name'] || typeof row['Category Name'] !== 'string' || row['Category Name'].trim() === '') {
    errors.push('Category Name is required');
  }

  // Validate display order
  if (row['Display Order'] && (isNaN(Number(row['Display Order'])) || Number(row['Display Order']) < 0)) {
    errors.push('Display Order must be a valid non-negative number');
  }

  // Validate boolean fields
  const booleanFields = ['Active'];
  booleanFields.forEach(field => {
    if (row[field] && !['yes', 'no', 'true', 'false', '1', '0'].includes(String(row[field]).toLowerCase())) {
      warnings.push(`${field} should be 'yes/no', 'true/false', or '1/0'`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate inventory item import data
 */
export const validateInventoryItem: ValidatorFunction = (row, index) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!row['Item Code'] || typeof row['Item Code'] !== 'string' || row['Item Code'].trim() === '') {
    errors.push('Item Code is required');
  }

  if (!row['Item Name'] || typeof row['Item Name'] !== 'string' || row['Item Name'].trim() === '') {
    errors.push('Item Name is required');
  }

  if (!row['Category'] || typeof row['Category'] !== 'string' || row['Category'].trim() === '') {
    errors.push('Category is required');
  }

  if (!row['Unit'] || typeof row['Unit'] !== 'string' || row['Unit'].trim() === '') {
    errors.push('Unit is required');
  }

  // Validate numeric fields
  const numericFields = ['Current Stock', 'Minimum Stock', 'Maximum Stock', 'Unit Cost'];
  numericFields.forEach(field => {
    if (row[field] !== undefined && row[field] !== '' && (isNaN(Number(row[field])) || Number(row[field]) < 0)) {
      errors.push(`${field} must be a valid non-negative number`);
    }
  });

  // Validate stock relationships
  if (row['Minimum Stock'] && row['Maximum Stock'] && Number(row['Minimum Stock']) > Number(row['Maximum Stock'])) {
    errors.push('Minimum Stock cannot be greater than Maximum Stock');
  }

  if (row['Current Stock'] && row['Maximum Stock'] && Number(row['Current Stock']) > Number(row['Maximum Stock'])) {
    warnings.push('Current Stock is greater than Maximum Stock');
  }

  if (row['Current Stock'] && row['Minimum Stock'] && Number(row['Current Stock']) < Number(row['Minimum Stock'])) {
    warnings.push('Current Stock is below Minimum Stock (low stock alert)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate staff import data
 */
export const validateStaff: ValidatorFunction = (row, index) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!row['Name'] || typeof row['Name'] !== 'string' || row['Name'].trim() === '') {
    errors.push('Name is required');
  }

  if (!row['Email'] || typeof row['Email'] !== 'string' || row['Email'].trim() === '') {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['Email'])) {
    errors.push('Invalid email format');
  }

  if (!row['Phone'] || typeof row['Phone'] !== 'string' || row['Phone'].trim() === '') {
    errors.push('Phone is required');
  } else if (!/^[\+]?[\d\s\-\(\)]+$/.test(row['Phone'])) {
    errors.push('Invalid phone format');
  }

  if (!row['Role'] || typeof row['Role'] !== 'string' || row['Role'].trim() === '') {
    errors.push('Role is required');
  }

  // Validate salary
  if (row['Salary'] && (isNaN(Number(row['Salary'])) || Number(row['Salary']) < 0)) {
    errors.push('Salary must be a valid non-negative number');
  }

  // Validate join date
  if (row['Join Date'] && isNaN(Date.parse(row['Join Date']))) {
    errors.push('Invalid Join Date format');
  }

  // Common roles validation
  const commonRoles = ['Manager', 'Chef', 'Server', 'Cashier', 'Kitchen Staff', 'Cleaner', 'Security'];
  if (row['Role'] && !commonRoles.includes(row['Role']) && !commonRoles.some(role => role.toLowerCase() === row['Role'].toLowerCase())) {
    warnings.push(`Uncommon role "${row['Role']}" - verify this is correct`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate customer import data
 */
export const validateCustomer: ValidatorFunction = (row, index) => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!row['Name'] || typeof row['Name'] !== 'string' || row['Name'].trim() === '') {
    errors.push('Name is required');
  }

  // Validate email if provided
  if (row['Email'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['Email'])) {
    errors.push('Invalid email format');
  }

  // Validate phone if provided
  if (row['Phone'] && !/^[\+]?[\d\s\-\(\)]+$/.test(row['Phone'])) {
    errors.push('Invalid phone format');
  }

  // At least one contact method should be provided
  if (!row['Email'] && !row['Phone']) {
    warnings.push('Either email or phone should be provided for contact');
  }

  // Validate membership level
  const validMemberships = ['Basic', 'Silver', 'Gold', 'Platinum', 'VIP'];
  if (row['Membership'] && !validMemberships.includes(row['Membership'])) {
    warnings.push(`Unknown membership level "${row['Membership']}" - verify this is correct`);
  }

  // Validate join date
  if (row['Join Date'] && isNaN(Date.parse(row['Join Date']))) {
    errors.push('Invalid Join Date format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Transform imported data to match database schema
 */
export function transformMenuItem(row: any): any {
  return {
    name: row['Item Name']?.trim(),
    description: row['Description']?.trim() || '',
    itemType: 'food',
    basePrice: Number(row['Base Price']) || 0,
    costPrice: Number(row['Cost Price']) || 0,
    preparationTime: Number(row['Preparation Time (min)']) || 15,
    spicyLevel: row['Spicy Level']?.toLowerCase() || 'none',
    isActive: true,
    isAvailable: parseBooleanField(row['Available'], true),
    dietary: {
      vegetarian: parseBooleanField(row['Vegetarian'], false),
      vegan: parseBooleanField(row['Vegan'], false),
      glutenFree: parseBooleanField(row['Gluten Free'], false),
      dairyFree: parseBooleanField(row['Dairy Free'], false),
      nutFree: parseBooleanField(row['Nut Free'], false),
      halal: parseBooleanField(row['Halal'], false),
      kosher: parseBooleanField(row['Kosher'], false),
    },
    categoryName: row['Category']?.trim(),
    images: [],
    displayOrder: Number(row['Display Order']) || 0
  };
}

export function transformCategory(row: any): any {
  return {
    name: row['Category Name']?.trim(),
    description: row['Description']?.trim() || '',
    displayOrder: Number(row['Display Order']) || 0,
    isActive: parseBooleanField(row['Active'], true),
  };
}

export function transformInventoryItem(row: any): any {
  return {
    itemCode: row['Item Code']?.trim().toUpperCase(),
    itemName: row['Item Name']?.trim(),
    category: row['Category']?.toLowerCase().replace(/\s+/g, '_'),
    subCategory: row['Sub Category']?.trim() || '',
    description: row['Description']?.trim() || '',
    units: {
      baseUnit: row['Unit']?.trim().toLowerCase() || 'piece',
      purchaseUnit: row['Unit']?.trim().toLowerCase() || 'piece',
      consumptionUnit: row['Unit']?.trim().toLowerCase() || 'piece'
    },
    stockLevels: {
      currentStock: Number(row['Current Stock']) || 0,
      minimumStock: Number(row['Minimum Stock']) || 0,
      maximumStock: Number(row['Maximum Stock']) || 100,
      reorderPoint: Number(row['Minimum Stock']) || 0,
      reorderQuantity: Number(row['Reorder Quantity']) || 10
    },
    costingInfo: {
      unitCost: Number(row['Unit Cost']) || 0
    },
    suppliers: row['Supplier'] ? [{
      supplierName: row['Supplier']?.trim(),
      supplierItemCode: row['Supplier Code']?.trim() || '',
      isPrimary: true
    }] : [],
    storageInfo: {
      location: {
        warehouse: row['Location']?.trim() || 'Storage'
      }
    },
    status: 'active'
  };
}

export function transformStaff(row: any): any {
  return {
    name: row['Name']?.trim(),
    email: row['Email']?.trim().toLowerCase(),
    phone: row['Phone']?.trim(),
    role: row['Role']?.trim(),
    department: row['Department']?.trim() || 'General',
    salary: Number(row['Salary']) || 0,
    joinDate: row['Join Date'] ? new Date(row['Join Date']) : new Date(),
    isActive: parseBooleanField(row['Active'], true),
    address: row['Address']?.trim() || '',
    emergencyContact: {
      name: row['Emergency Contact Name']?.trim() || '',
      phone: row['Emergency Contact Phone']?.trim() || ''
    }
  };
}

export function transformCustomer(row: any): any {
  return {
    name: row['Name']?.trim(),
    email: row['Email']?.trim().toLowerCase() || '',
    phone: row['Phone']?.trim() || '',
    address: row['Address']?.trim() || '',
    membershipLevel: row['Membership']?.trim() || 'Basic',
    joinDate: row['Join Date'] ? new Date(row['Join Date']) : new Date(),
    isActive: parseBooleanField(row['Active'], true),
    preferences: {
      dietary: row['Dietary Preferences']?.trim() || '',
      allergies: row['Allergies']?.trim() || ''
    }
  };
}

/**
 * Parse boolean field from various formats
 */
function parseBooleanField(value: any, defaultValue: boolean = false): boolean {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }

  const strValue = String(value).toLowerCase().trim();
  return ['yes', 'true', '1', 'y', 'on', 'enabled'].includes(strValue);
}

/**
 * Get validator function by type
 */
export function getValidator(type: string): ValidatorFunction {
  const validators: Record<string, ValidatorFunction> = {
    'menu-items': validateMenuItem,
    'categories': validateCategory,
    'inventory': validateInventoryItem,
    'staff': validateStaff,
    'customers': validateCustomer
  };

  return validators[type] || ((row, index) => ({ isValid: true, errors: [], warnings: [] }));
}

/**
 * Get transformer function by type
 */
export function getTransformer(type: string): (row: any) => any {
  const transformers: Record<string, (row: any) => any> = {
    'menu-items': transformMenuItem,
    'categories': transformCategory,
    'inventory': transformInventoryItem,
    'staff': transformStaff,
    'customers': transformCustomer
  };

  return transformers[type] || ((row: any) => row);
}