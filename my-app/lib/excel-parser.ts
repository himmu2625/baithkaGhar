import * as XLSX from 'xlsx';

export interface ParsedPricingRow {
  property: string;
  roomCategory: string;
  planType: 'EP' | 'CP' | 'MAP' | 'AP';
  occupancyType: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD';
  startDate: string;
  endDate: string;
  price: number;
  seasonType?: string;
}

export interface ExcelParseResult {
  success: boolean;
  data: ParsedPricingRow[];
  errors: string[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    propertyNames: string[];
    roomCategories: string[];
    dateRange: { min: string; max: string };
  };
}

export class ExcelPricingParser {
  private readonly REQUIRED_HEADERS = [
    'PROPERTY',
    'ROOM CATEGORY',
    'PLAN TYPE',
    'OCCUPANCY TYPE',
    'START DATE',
    'END DATE',
    'PRICE'
  ];

  private readonly VALID_PLAN_TYPES = ['EP', 'CP', 'MAP', 'AP'];
  private readonly VALID_OCCUPANCY_TYPES = ['SINGLE SHARING', 'DOUBLE SHARING', 'TRIPLE SHARING', 'QUAD SHARING'];

  async parseExcelFile(file: Buffer): Promise<ExcelParseResult> {
    try {
      const workbook = XLSX.read(file, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        return {
          success: false,
          data: [],
          errors: ['Excel file must contain headers and at least one data row'],
          summary: this.createEmptySummary()
        };
      }

      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1) as any[][];

      // Validate headers
      const headerValidation = this.validateHeaders(headers);
      if (!headerValidation.isValid) {
        return {
          success: false,
          data: [],
          errors: headerValidation.errors,
          summary: this.createEmptySummary()
        };
      }

      // Parse data rows
      const parseResult = this.parseDataRows(headers, dataRows);

      return {
        success: parseResult.errors.length === 0,
        data: parseResult.validData,
        errors: parseResult.errors,
        summary: this.generateSummary(parseResult.validData, parseResult.errors.length)
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        errors: [`Failed to parse Excel file: ${error.message}`],
        summary: this.createEmptySummary()
      };
    }
  }

  private validateHeaders(headers: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const normalizedHeaders = headers.map(h => h?.toString().toUpperCase().trim());

    for (const requiredHeader of this.REQUIRED_HEADERS) {
      if (!normalizedHeaders.includes(requiredHeader)) {
        errors.push(`Missing required header: ${requiredHeader}`);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  private parseDataRows(headers: string[], dataRows: any[][]): { validData: ParsedPricingRow[]; errors: string[] } {
    const validData: ParsedPricingRow[] = [];
    const errors: string[] = [];
    const headerMap = this.createHeaderMap(headers);

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const rowNumber = i + 2; // +2 because of header row and 0-indexing

      try {
        const parsedRow = this.parseRow(row, headerMap, rowNumber);
        if (parsedRow) {
          validData.push(parsedRow);
        }
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    }

    return { validData, errors };
  }

  private createHeaderMap(headers: string[]): Record<string, number> {
    const map: Record<string, number> = {};
    headers.forEach((header, index) => {
      if (header) {
        map[header.toString().toUpperCase().trim()] = index;
      }
    });
    return map;
  }

  private parseRow(row: any[], headerMap: Record<string, number>, rowNumber: number): ParsedPricingRow | null {
    // Skip empty rows
    if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
      return null;
    }

    const getValue = (headerName: string): string => {
      const index = headerMap[headerName];
      return index !== undefined ? (row[index]?.toString().trim() || '') : '';
    };

    const property = getValue('PROPERTY');
    const roomCategory = getValue('ROOM CATEGORY');
    const planType = getValue('PLAN TYPE')?.toUpperCase();
    const occupancyType = getValue('OCCUPANCY TYPE')?.toUpperCase();
    const startDate = getValue('START DATE');
    const endDate = getValue('END DATE');
    const priceStr = getValue('PRICE');
    const seasonType = getValue('SEASON TYPE') || undefined;

    // Validation
    if (!property) throw new Error('Property name is required');
    if (!roomCategory) throw new Error('Room category is required');
    if (!this.VALID_PLAN_TYPES.includes(planType)) {
      throw new Error(`Invalid plan type: ${planType}. Must be one of: ${this.VALID_PLAN_TYPES.join(', ')}`);
    }

    // Normalize occupancy type
    const normalizedOccupancy = this.normalizeOccupancyType(occupancyType);
    if (!normalizedOccupancy) {
      throw new Error(`Invalid occupancy type: ${occupancyType}. Must be one of: ${this.VALID_OCCUPANCY_TYPES.join(', ')}`);
    }

    if (!startDate) throw new Error('Start date is required');
    if (!endDate) throw new Error('End date is required');
    if (!priceStr) throw new Error('Price is required');

    // Parse and validate dates
    const parsedStartDate = this.parseDate(startDate);
    const parsedEndDate = this.parseDate(endDate);

    if (!parsedStartDate) throw new Error(`Invalid start date format: ${startDate}`);
    if (!parsedEndDate) throw new Error(`Invalid end date format: ${endDate}`);
    if (parsedStartDate >= parsedEndDate) throw new Error('Start date must be before end date');

    // Parse and validate price
    const price = parseFloat(priceStr.replace(/[^\d.-]/g, ''));
    if (isNaN(price) || price < 0) throw new Error(`Invalid price: ${priceStr}`);

    return {
      property: property,
      roomCategory: roomCategory,
      planType: planType as 'EP' | 'CP' | 'MAP' | 'AP',
      occupancyType: normalizedOccupancy,
      startDate: parsedStartDate.toISOString().split('T')[0],
      endDate: parsedEndDate.toISOString().split('T')[0],
      price: price,
      seasonType: seasonType
    };
  }

  private normalizeOccupancyType(occupancyType: string): 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD' | null {
    const normalized = occupancyType.toUpperCase().trim();

    if (normalized.includes('SINGLE')) return 'SINGLE';
    if (normalized.includes('DOUBLE')) return 'DOUBLE';
    if (normalized.includes('TRIPLE')) return 'TRIPLE';
    if (normalized.includes('QUAD')) return 'QUAD';

    return null;
  }

  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Try different date formats
    const formats = [
      // Excel date formats
      /^\d{5}$/, // Excel serial number
      // Standard formats
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{1,2}\/\d{1,2}\/\d{4}$/, // M/D/YYYY or MM/D/YYYY
    ];

    // Check if it's an Excel serial number
    if (/^\d{5}$/.test(dateStr.trim())) {
      const excelDate = new Date((parseInt(dateStr) - 25569) * 86400 * 1000);
      return isNaN(excelDate.getTime()) ? null : excelDate;
    }

    // Try parsing as regular date
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  }

  private generateSummary(validData: ParsedPricingRow[], errorCount: number) {
    const propertyNames = [...new Set(validData.map(row => row.property))];
    const roomCategories = [...new Set(validData.map(row => row.roomCategory))];

    const dates = validData.map(row => row.startDate).concat(validData.map(row => row.endDate));
    const sortedDates = dates.sort();

    return {
      totalRows: validData.length + errorCount,
      validRows: validData.length,
      invalidRows: errorCount,
      propertyNames,
      roomCategories,
      dateRange: {
        min: sortedDates[0] || '',
        max: sortedDates[sortedDates.length - 1] || ''
      }
    };
  }

  private createEmptySummary() {
    return {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      propertyNames: [],
      roomCategories: [],
      dateRange: { min: '', max: '' }
    };
  }
}