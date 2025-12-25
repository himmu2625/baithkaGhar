import * as XLSX from 'xlsx';

export type SupportedFileType = 'xlsx' | 'xls' | 'csv' | 'json';

export interface ImportResult<T = any> {
  success: boolean;
  data: T[];
  errors: string[];
  warnings: string[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    processedAt: string;
  };
}

export interface ExportOptions {
  filename: string;
  format: SupportedFileType;
  sheetName?: string;
  headers?: string[];
  includeMetadata?: boolean;
}

/**
 * Process uploaded file and convert to JSON data
 */
export async function processImportFile<T = any>(
  file: File,
  validator?: (row: any, index: number) => { isValid: boolean; errors: string[]; warnings: string[] }
): Promise<ImportResult<T>> {
  try {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() as SupportedFileType;
    let jsonData: any[] = [];

    switch (fileExtension) {
      case 'xlsx':
      case 'xls':
        jsonData = await processExcelFile(file);
        break;
      case 'csv':
        jsonData = await processCsvFile(file);
        break;
      case 'json':
        jsonData = await processJsonFile(file);
        break;
      default:
        throw new Error(`Unsupported file format: ${fileExtension}`);
    }

    const result: ImportResult<T> = {
      success: true,
      data: [],
      errors: [],
      warnings: [],
      summary: {
        totalRows: jsonData.length,
        validRows: 0,
        invalidRows: 0,
        processedAt: new Date().toISOString()
      }
    };

    // Process and validate each row
    jsonData.forEach((row, index) => {
      try {
        if (validator) {
          const validation = validator(row, index);
          if (validation.isValid) {
            result.data.push(row as T);
            result.summary.validRows++;
          } else {
            result.summary.invalidRows++;
            result.errors.push(`Row ${index + 1}: ${validation.errors.join(', ')}`);
          }
          if (validation.warnings.length > 0) {
            result.warnings.push(`Row ${index + 1}: ${validation.warnings.join(', ')}`);
          }
        } else {
          // No validator provided, accept all rows
          result.data.push(row as T);
          result.summary.validRows++;
        }
      } catch (error) {
        result.summary.invalidRows++;
        result.errors.push(`Row ${index + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    return result;
  } catch (error) {
    return {
      success: false,
      data: [],
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
      warnings: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        processedAt: new Date().toISOString()
      }
    };
  }
}

/**
 * Process Excel file (.xlsx, .xls)
 */
async function processExcelFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          blankrows: false
        });
        
        // Convert array of arrays to array of objects using first row as headers
        if (jsonData.length === 0) {
          resolve([]);
          return;
        }
        
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1) as any[][];
        
        const result = rows.map(row => {
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = row[index] || '';
          });
          return obj;
        });
        
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsBinaryString(file);
  });
}

/**
 * Process CSV file
 */
async function processCsvFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          resolve([]);
          return;
        }
        
        // Parse CSV (basic implementation)
        const headers = parseCsvLine(lines[0]);
        const result = lines.slice(1).map(line => {
          const values = parseCsvLine(line);
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
        
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to process CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Parse a single CSV line handling quotes and commas
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

/**
 * Process JSON file
 */
async function processJsonFile(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const jsonText = e.target?.result as string;
        const data = JSON.parse(jsonText);
        
        if (!Array.isArray(data)) {
          reject(new Error('JSON file must contain an array of objects'));
          return;
        }
        
        resolve(data);
      } catch (error) {
        reject(new Error(`Failed to process JSON file: ${error instanceof Error ? error.message : 'Invalid JSON format'}`));
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Export data to different formats
 */
export function exportData<T = any>(
  data: T[],
  options: ExportOptions
): void {
  const { format, filename, sheetName = 'Sheet1', headers, includeMetadata = false } = options;
  
  try {
    switch (format) {
      case 'xlsx':
      case 'xls':
        exportToExcel(data, filename, sheetName, headers, includeMetadata);
        break;
      case 'csv':
        exportToCsv(data, filename, headers, includeMetadata);
        break;
      case 'json':
        exportToJson(data, filename, includeMetadata);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  } catch (error) {
    throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export to Excel format
 */
function exportToExcel<T>(
  data: T[],
  filename: string,
  sheetName: string,
  headers?: string[],
  includeMetadata = false
): void {
  const workbook = XLSX.utils.book_new();
  
  // Add metadata sheet if requested
  if (includeMetadata) {
    const metadata = [
      ['Export Date', new Date().toISOString()],
      ['Total Records', data.length],
      ['Generated By', 'Baithaka Ghar System']
    ];
    const metadataWS = XLSX.utils.aoa_to_sheet(metadata);
    XLSX.utils.book_append_sheet(workbook, metadataWS, 'Metadata');
  }
  
  // Create main data sheet
  let worksheet: XLSX.WorkSheet;
  
  if (headers) {
    // Use custom headers
    const filteredData = data.map(item => {
      const filtered: any = {};
      headers.forEach(header => {
        filtered[header] = (item as any)[header] || '';
      });
      return filtered;
    });
    worksheet = XLSX.utils.json_to_sheet(filteredData, { header: headers });
  } else {
    // Use all available fields
    worksheet = XLSX.utils.json_to_sheet(data);
  }
  
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Save file
  const fileExtension = filename.endsWith('.xlsx') || filename.endsWith('.xls') ? '' : '.xlsx';
  XLSX.writeFile(workbook, `${filename}${fileExtension}`);
}

/**
 * Export to CSV format
 */
function exportToCsv<T>(
  data: T[],
  filename: string,
  headers?: string[],
  includeMetadata = false
): void {
  let csvContent = '';
  
  // Add metadata if requested
  if (includeMetadata) {
    csvContent += `# Export Date: ${new Date().toISOString()}\n`;
    csvContent += `# Total Records: ${data.length}\n`;
    csvContent += `# Generated By: Baithaka Ghar System\n\n`;
  }
  
  if (data.length === 0) {
    downloadFile(csvContent, filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv');
    return;
  }
  
  // Determine headers
  const csvHeaders = headers || Object.keys(data[0] as any);
  csvContent += csvHeaders.map(header => `"${header}"`).join(',') + '\n';
  
  // Add data rows
  data.forEach(item => {
    const row = csvHeaders.map(header => {
      const value = (item as any)[header] || '';
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvContent += row.join(',') + '\n';
  });
  
  downloadFile(csvContent, filename.endsWith('.csv') ? filename : `${filename}.csv`, 'text/csv');
}

/**
 * Export to JSON format
 */
function exportToJson<T>(
  data: T[],
  filename: string,
  includeMetadata = false
): void {
  const exportData = {
    ...(includeMetadata && {
      metadata: {
        exportDate: new Date().toISOString(),
        totalRecords: data.length,
        generatedBy: 'Baithaka Ghar System'
      }
    }),
    data
  };
  
  const jsonString = JSON.stringify(includeMetadata ? exportData : data, null, 2);
  downloadFile(jsonString, filename.endsWith('.json') ? filename : `${filename}.json`, 'application/json');
}

/**
 * Download file to user's browser
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generate import template for a specific data type
 */
export function generateImportTemplate(
  templateType: 'menu-items' | 'categories' | 'inventory' | 'staff' | 'customers',
  format: SupportedFileType = 'xlsx'
): void {
  const templates = {
    'menu-items': [
      {
        'Item Name': 'Butter Chicken',
        'Description': 'Tender chicken in creamy tomato sauce',
        'Category': 'Main Course',
        'Base Price': 350,
        'Cost Price': 200,
        'Preparation Time (min)': 25,
        'Spicy Level': 'medium',
        'Vegetarian': 'no',
        'Available': 'yes'
      }
    ],
    'categories': [
      {
        'Category Name': 'Appetizers',
        'Description': 'Starters and small plates',
        'Display Order': 1,
        'Active': 'yes'
      }
    ],
    'inventory': [
      {
        'Item Code': 'RICE001',
        'Item Name': 'Basmati Rice',
        'Category': 'Grains',
        'Unit': 'kg',
        'Current Stock': 50,
        'Minimum Stock': 20,
        'Maximum Stock': 100,
        'Unit Cost': 120,
        'Supplier': 'ABC Rice Mills',
        'Location': 'Storage Room A'
      }
    ],
    'staff': [
      {
        'Name': 'John Doe',
        'Email': 'john@example.com',
        'Phone': '+91 9876543210',
        'Role': 'Chef',
        'Department': 'Kitchen',
        'Salary': 35000,
        'Join Date': '2024-01-15'
      }
    ],
    'customers': [
      {
        'Name': 'Jane Smith',
        'Email': 'jane@example.com',
        'Phone': '+91 9876543210',
        'Address': '123 Main St, City',
        'Membership': 'Gold',
        'Join Date': '2024-01-01'
      }
    ]
  };
  
  const templateData = templates[templateType];
  const filename = `${templateType}-import-template`;
  
  exportData(templateData, {
    filename,
    format,
    sheetName: templateType.replace('-', ' ').toUpperCase(),
    includeMetadata: true
  });
}