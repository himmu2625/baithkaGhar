import { NextRequest, NextResponse } from 'next/server';
import { AssetImportUtility } from '@/scripts/migration/asset-import-utility';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const action = formData.get('action') as string;

    if (!file && action !== 'template') {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const importer = new AssetImportUtility();
    await importer.initialize();

    switch (action) {
      case 'import':
        if (!file) {
          return NextResponse.json(
            { error: 'File is required for import' },
            { status: 400 }
          );
        }

        // Save uploaded file temporarily
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = file.name;
        const tempPath = join(process.cwd(), 'temp', fileName);

        await writeFile(tempPath, buffer);

        try {
          let result;
          const fileExtension = fileName.split('.').pop()?.toLowerCase();

          switch (fileExtension) {
            case 'xlsx':
            case 'xls':
              result = await importer.importFromExcel(tempPath);
              break;
            case 'csv':
              result = await importer.importFromCSV(tempPath);
              break;
            case 'json':
              const jsonData = JSON.parse(buffer.toString());
              result = await importer.importFromJSON(jsonData);
              break;
            default:
              throw new Error('Unsupported file format. Use Excel (.xlsx), CSV (.csv), or JSON (.json)');
          }

          // Clean up temp file
          await unlink(tempPath);

          return NextResponse.json({
            success: true,
            data: result
          });
        } catch (importError) {
          // Clean up temp file on error
          try {
            await unlink(tempPath);
          } catch (cleanupError) {
            console.error('Failed to clean up temp file:', cleanupError);
          }
          throw importError;
        }

      case 'template':
        const template = await importer.generateSampleTemplate();
        return NextResponse.json({
          success: true,
          data: {
            template,
            headers: [
              'roomNumber',
              'assetName',
              'category',
              'brand',
              'model',
              'serialNumber',
              'purchaseDate',
              'purchasePrice',
              'supplier',
              'warrantyExpiry',
              'condition',
              'location',
              'notes',
              'qrCode'
            ],
            instructions: {
              roomNumber: 'Room number (must exist in system)',
              assetName: 'Name/description of the asset',
              category: 'Asset category (electronics, furniture, appliances, etc.)',
              brand: 'Manufacturer brand (optional)',
              model: 'Model number (optional)',
              serialNumber: 'Serial number (optional)',
              purchaseDate: 'Purchase date (YYYY-MM-DD format)',
              purchasePrice: 'Purchase price in USD',
              supplier: 'Vendor/supplier name (optional)',
              warrantyExpiry: 'Warranty expiry date (YYYY-MM-DD format)',
              condition: 'Current condition (excellent, good, fair, poor, critical)',
              location: 'Specific location within room (optional)',
              notes: 'Additional notes (optional)',
              qrCode: 'QR code (optional, will be auto-generated if not provided)'
            }
          }
        });

      case 'validate':
        if (!file) {
          return NextResponse.json(
            { error: 'File is required for validation' },
            { status: 400 }
          );
        }

        // Validate file format and structure
        const validationResult = await this.validateImportFile(file);
        return NextResponse.json({
          success: true,
          data: validationResult
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: import, template, or validate' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Asset import API error:', error);
    return NextResponse.json(
      { error: 'Asset import failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function validateImportFile(file: File): Promise<{
  isValid: boolean;
  issues: string[];
  preview: any[];
  rowCount: number;
}> {
  const issues: string[] = [];
  let preview: any[] = [];
  let rowCount = 0;

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = file.name;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    if (!['xlsx', 'xls', 'csv', 'json'].includes(fileExtension || '')) {
      issues.push('Unsupported file format. Use Excel (.xlsx), CSV (.csv), or JSON (.json)');
      return { isValid: false, issues, preview, rowCount };
    }

    if (fileExtension === 'json') {
      try {
        const jsonData = JSON.parse(buffer.toString());
        if (!Array.isArray(jsonData)) {
          issues.push('JSON file must contain an array of objects');
        } else {
          preview = jsonData.slice(0, 5);
          rowCount = jsonData.length;
        }
      } catch (parseError) {
        issues.push('Invalid JSON format');
      }
    } else if (fileExtension === 'csv') {
      const csvText = buffer.toString();
      const lines = csvText.split('\n').filter(line => line.trim());
      rowCount = Math.max(0, lines.length - 1); // Exclude header

      if (lines.length < 2) {
        issues.push('CSV file must contain at least a header and one data row');
      } else {
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const requiredHeaders = ['roomNumber', 'assetName', 'category'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
          issues.push(`Missing required columns: ${missingHeaders.join(', ')}`);
        }

        // Parse first few rows for preview
        for (let i = 1; i < Math.min(6, lines.length); i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const rowObject: any = {};
          headers.forEach((header, index) => {
            rowObject[header] = values[index] || '';
          });
          preview.push(rowObject);
        }
      }
    } else {
      // Excel file validation would require XLSX library
      // For now, we'll do basic validation
      if (file.size === 0) {
        issues.push('File is empty');
      } else if (file.size > 10 * 1024 * 1024) { // 10MB limit
        issues.push('File is too large (maximum 10MB)');
      }
    }

    // Validate preview data
    preview.forEach((row, index) => {
      if (!row.roomNumber || !row.assetName || !row.category) {
        issues.push(`Row ${index + 2}: Missing required fields (roomNumber, assetName, or category)`);
      }

      if (row.purchasePrice && isNaN(parseFloat(row.purchasePrice))) {
        issues.push(`Row ${index + 2}: Invalid purchase price format`);
      }

      if (row.purchaseDate && isNaN(Date.parse(row.purchaseDate))) {
        issues.push(`Row ${index + 2}: Invalid purchase date format (use YYYY-MM-DD)`);
      }
    });

  } catch (error) {
    issues.push(`File validation error: ${(error as Error).message}`);
  }

  return {
    isValid: issues.length === 0,
    issues,
    preview,
    rowCount
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get('batchId');

    const importer = new AssetImportUtility();
    await importer.initialize();

    if (batchId) {
      // Get specific import batch status
      const { db } = await (importer as any).db;
      const importLog = await db.collection('import_logs').findOne({
        type: 'asset_import',
        batchId
      });

      if (!importLog) {
        return NextResponse.json(
          { error: 'Import batch not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: importLog
      });
    } else {
      // Get all import batches
      const { db } = await (importer as any).db;
      const importLogs = await db.collection('import_logs')
        .find({ type: 'asset_import' })
        .sort({ timestamp: -1 })
        .limit(20)
        .toArray();

      return NextResponse.json({
        success: true,
        data: importLogs
      });
    }
  } catch (error) {
    console.error('Asset import status error:', error);
    return NextResponse.json(
      { error: 'Failed to get import status' },
      { status: 500 }
    );
  }
}