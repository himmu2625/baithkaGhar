import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import * as XLSX from 'xlsx';
import csv from 'csv-parser';
import { createReadStream, readFileSync } from 'fs';

interface AssetImportRow {
  roomNumber: string;
  assetName: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: string;
  supplier?: string;
  warrantyExpiry?: string;
  condition?: string;
  location?: string;
  notes?: string;
  qrCode?: string;
}

interface ProcessedAsset {
  roomId: ObjectId;
  name: string;
  category: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  qrCode: string;
  status: 'active' | 'maintenance' | 'retired' | 'missing';
  condition: {
    overall: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    lastAssessed: Date;
    issues: string[];
    notes: string;
  };
  location: {
    roomId: ObjectId;
    roomNumber: string;
    specificLocation: string;
    coordinates?: { x: number; y: number; z: number };
  };
  financial: {
    purchasePrice: number;
    currentValue: number;
    depreciationRate: number;
    supplier: string;
    warranty: {
      startDate: Date;
      endDate: Date;
      provider: string;
      terms: string;
    };
  };
  specifications: {
    dimensions?: { width: number; height: number; depth: number; unit: string };
    weight?: { value: number; unit: string };
    powerRequirements?: { voltage: number; wattage: number };
    connectivity?: string[];
    features: string[];
    manualUrl?: string;
  };
  maintenance: {
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually' | 'as_needed';
      lastPerformed: Date;
      nextScheduled: Date;
      responsibleRole: string;
    };
    history: Array<{
      date: Date;
      type: 'inspection' | 'cleaning' | 'repair' | 'replacement' | 'upgrade';
      description: string;
      cost: number;
      performedBy: string;
      parts?: Array<{ name: string; cost: number; quantity: number }>;
    }>;
  };
  digital: {
    hasQRCode: boolean;
    hasRFID: boolean;
    iotEnabled: boolean;
    iotSensorData?: Array<{
      sensorType: string;
      lastReading: any;
      lastUpdated: Date;
      thresholds: { min?: number; max?: number; alerts: boolean };
    }>;
  };
  lifecycle: {
    acquisitionDate: Date;
    expectedLifespan: number; // in years
    currentAge: number;
    retirementDate?: Date;
    disposalMethod?: string;
    replacementPlan?: {
      scheduled: boolean;
      estimatedDate: Date;
      budgetAllocated: number;
      replacementModel?: string;
    };
  };
  compliance: {
    certifications: string[];
    lastInspection?: Date;
    nextInspection?: Date;
    regulatoryNotes: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  importBatch: string;
}

export class AssetImportUtility {
  private db: any;
  private importLog: Array<{
    rowNumber: number;
    assetName: string;
    roomNumber: string;
    status: 'success' | 'error' | 'skipped';
    message: string;
    timestamp: Date;
  }> = [];

  constructor() {}

  async initialize() {
    const { db } = await connectToDatabase();
    this.db = db;
  }

  async importFromExcel(filePath: string): Promise<{
    total: number;
    imported: number;
    errors: number;
    skipped: number;
    batchId: string;
  }> {
    console.log('Starting asset import from Excel...');

    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData: AssetImportRow[] = XLSX.utils.sheet_to_json(worksheet);

    return await this.processAssetData(rawData, 'excel');
  }

  async importFromCSV(filePath: string): Promise<{
    total: number;
    imported: number;
    errors: number;
    skipped: number;
    batchId: string;
  }> {
    console.log('Starting asset import from CSV...');

    const rawData: AssetImportRow[] = [];

    return new Promise((resolve, reject) => {
      createReadStream(filePath)
        .pipe(csv())
        .on('data', (data: AssetImportRow) => rawData.push(data))
        .on('end', async () => {
          try {
            const result = await this.processAssetData(rawData, 'csv');
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  async importFromJSON(data: AssetImportRow[]): Promise<{
    total: number;
    imported: number;
    errors: number;
    skipped: number;
    batchId: string;
  }> {
    console.log('Starting asset import from JSON...');
    return await this.processAssetData(data, 'json');
  }

  private async processAssetData(
    rawData: AssetImportRow[],
    source: string
  ): Promise<{
    total: number;
    imported: number;
    errors: number;
    skipped: number;
    batchId: string;
  }> {
    const batchId = `import_${Date.now()}_${source}`;
    let imported = 0;
    let errors = 0;
    let skipped = 0;

    console.log(`Processing ${rawData.length} asset records...`);

    // Get all rooms for mapping
    const rooms = await this.db.collection('rooms').find({}).toArray();
    const roomMap = new Map(rooms.map(room => [room.number, room._id]));

    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      const rowNumber = i + 1;

      try {
        const result = await this.processAssetRow(row, roomMap, batchId, rowNumber);

        if (result.success) {
          imported++;
          this.logImport(rowNumber, row.assetName, row.roomNumber, 'success', 'Asset imported successfully');
        } else {
          skipped++;
          this.logImport(rowNumber, row.assetName, row.roomNumber, 'skipped', result.reason || 'Unknown reason');
        }
      } catch (error) {
        errors++;
        this.logImport(rowNumber, row.assetName, row.roomNumber, 'error', (error as Error).message);
        console.error(`Failed to process row ${rowNumber}:`, error);
      }
    }

    await this.saveImportLog(batchId, source);

    return {
      total: rawData.length,
      imported,
      errors,
      skipped,
      batchId
    };
  }

  private async processAssetRow(
    row: AssetImportRow,
    roomMap: Map<string, ObjectId>,
    batchId: string,
    rowNumber: number
  ): Promise<{ success: boolean; reason?: string }> {
    // Validate required fields
    if (!row.roomNumber || !row.assetName || !row.category) {
      return { success: false, reason: 'Missing required fields: roomNumber, assetName, or category' };
    }

    // Find room
    const roomId = roomMap.get(row.roomNumber.toString());
    if (!roomId) {
      return { success: false, reason: `Room ${row.roomNumber} not found` };
    }

    // Check for duplicate assets
    const existingAsset = await this.db.collection('room_assets').findOne({
      'location.roomId': roomId,
      name: row.assetName,
      serialNumber: row.serialNumber || null
    });

    if (existingAsset) {
      return { success: false, reason: 'Asset already exists in this room' };
    }

    // Generate QR code if not provided
    const qrCode = row.qrCode || this.generateQRCode(row.roomNumber, row.assetName);

    // Parse dates
    const purchaseDate = row.purchaseDate ? new Date(row.purchaseDate) : new Date();
    const warrantyExpiry = row.warrantyExpiry ? new Date(row.warrantyExpiry) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Calculate current value and depreciation
    const purchasePrice = parseFloat(row.purchasePrice || '0');
    const currentValue = this.calculateCurrentValue(purchasePrice, purchaseDate);
    const depreciationRate = this.calculateDepreciationRate(purchasePrice, currentValue, purchaseDate);

    // Create processed asset
    const processedAsset: ProcessedAsset = {
      roomId,
      name: row.assetName,
      category: this.standardizeCategory(row.category),
      brand: row.brand,
      model: row.model,
      serialNumber: row.serialNumber,
      qrCode,
      status: 'active',
      condition: {
        overall: this.mapCondition(row.condition),
        lastAssessed: new Date(),
        issues: [],
        notes: row.notes || ''
      },
      location: {
        roomId,
        roomNumber: row.roomNumber,
        specificLocation: row.location || 'Room',
        coordinates: this.generateCoordinates()
      },
      financial: {
        purchasePrice,
        currentValue,
        depreciationRate,
        supplier: row.supplier || 'Unknown',
        warranty: {
          startDate: purchaseDate,
          endDate: warrantyExpiry,
          provider: row.supplier || 'Manufacturer',
          terms: 'Standard warranty terms'
        }
      },
      specifications: {
        features: this.extractFeatures(row.assetName, row.category),
        dimensions: this.getStandardDimensions(row.category),
        powerRequirements: this.getStandardPowerRequirements(row.category),
        connectivity: this.getStandardConnectivity(row.category)
      },
      maintenance: {
        schedule: {
          frequency: this.getMaintenanceFrequency(row.category),
          lastPerformed: new Date(),
          nextScheduled: this.calculateNextMaintenance(row.category),
          responsibleRole: 'maintenance'
        },
        history: []
      },
      digital: {
        hasQRCode: true,
        hasRFID: false,
        iotEnabled: this.isIoTCapable(row.category),
        iotSensorData: this.isIoTCapable(row.category) ? this.generateIoTSensors(row.category) : undefined
      },
      lifecycle: {
        acquisitionDate: purchaseDate,
        expectedLifespan: this.getExpectedLifespan(row.category),
        currentAge: this.calculateAge(purchaseDate),
        replacementPlan: {
          scheduled: false,
          estimatedDate: new Date(purchaseDate.getTime() + this.getExpectedLifespan(row.category) * 365 * 24 * 60 * 60 * 1000),
          budgetAllocated: Math.round(currentValue * 1.2)
        }
      },
      compliance: {
        certifications: this.getRequiredCertifications(row.category),
        regulatoryNotes: []
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      importBatch: batchId
    };

    // Insert the asset
    await this.db.collection('room_assets').insertOne(processedAsset);

    // Update room inventory
    await this.updateRoomInventory(roomId, processedAsset);

    return { success: true };
  }

  private generateQRCode(roomNumber: string, assetName: string): string {
    const sanitized = assetName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `ASSET-${roomNumber}-${sanitized}-${Date.now().toString().slice(-4)}`;
  }

  private standardizeCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      'furniture': 'furniture',
      'electronics': 'electronics',
      'appliances': 'appliances',
      'fixtures': 'fixtures',
      'linen': 'linen',
      'bathroom': 'bathroom',
      'kitchen': 'kitchen',
      'lighting': 'lighting',
      'hvac': 'hvac',
      'safety': 'safety',
      'decor': 'decor',
      'technology': 'electronics'
    };

    return categoryMap[category.toLowerCase()] || 'other';
  }

  private mapCondition(condition?: string): ProcessedAsset['condition']['overall'] {
    if (!condition) return 'good';

    const conditionMap: Record<string, ProcessedAsset['condition']['overall']> = {
      'excellent': 'excellent',
      'good': 'good',
      'fair': 'fair',
      'poor': 'poor',
      'critical': 'critical',
      'new': 'excellent',
      'used': 'good',
      'damaged': 'poor'
    };

    return conditionMap[condition.toLowerCase()] || 'good';
  }

  private calculateCurrentValue(purchasePrice: number, purchaseDate: Date): number {
    if (purchasePrice <= 0) return 0;

    const ageInYears = this.calculateAge(purchaseDate);
    const depreciationRate = 0.15; // 15% per year standard depreciation

    const depreciatedValue = purchasePrice * Math.pow(1 - depreciationRate, ageInYears);
    return Math.max(Math.round(depreciatedValue), Math.round(purchasePrice * 0.1)); // Minimum 10% of original value
  }

  private calculateDepreciationRate(purchasePrice: number, currentValue: number, purchaseDate: Date): number {
    if (purchasePrice <= 0) return 0;

    const ageInYears = this.calculateAge(purchaseDate);
    if (ageInYears === 0) return 0;

    const totalDepreciation = purchasePrice - currentValue;
    return Math.round((totalDepreciation / purchasePrice) * 100) / 100;
  }

  private calculateAge(date: Date): number {
    const now = new Date();
    const ageMs = now.getTime() - date.getTime();
    return Math.max(0, ageMs / (365.25 * 24 * 60 * 60 * 1000));
  }

  private generateCoordinates(): { x: number; y: number; z: number } {
    return {
      x: Math.round(Math.random() * 100) / 100,
      y: Math.round(Math.random() * 100) / 100,
      z: Math.round(Math.random() * 10) / 10
    };
  }

  private extractFeatures(assetName: string, category: string): string[] {
    const featureMap: Record<string, string[]> = {
      'electronics': ['Digital Display', 'Remote Control', 'Energy Efficient'],
      'furniture': ['Ergonomic Design', 'Durable Material'],
      'appliances': ['Energy Star Rated', 'Automatic Shut-off'],
      'fixtures': ['Water Efficient', 'Easy Maintenance'],
      'lighting': ['LED Technology', 'Dimmable', 'Long Lifespan']
    };

    return featureMap[category] || ['Standard Features'];
  }

  private getStandardDimensions(category: string): ProcessedAsset['specifications']['dimensions'] {
    const dimensionMap: Record<string, { width: number; height: number; depth: number; unit: string }> = {
      'furniture': { width: 60, height: 30, depth: 24, unit: 'inches' },
      'electronics': { width: 24, height: 18, depth: 12, unit: 'inches' },
      'appliances': { width: 36, height: 48, depth: 24, unit: 'inches' }
    };

    return dimensionMap[category];
  }

  private getStandardPowerRequirements(category: string): ProcessedAsset['specifications']['powerRequirements'] {
    const powerMap: Record<string, { voltage: number; wattage: number }> = {
      'electronics': { voltage: 120, wattage: 150 },
      'appliances': { voltage: 120, wattage: 800 },
      'lighting': { voltage: 120, wattage: 60 }
    };

    return powerMap[category];
  }

  private getStandardConnectivity(category: string): string[] {
    const connectivityMap: Record<string, string[]> = {
      'electronics': ['HDMI', 'USB', 'WiFi'],
      'appliances': ['Power Cord'],
      'lighting': ['Hardwired']
    };

    return connectivityMap[category] || [];
  }

  private getMaintenanceFrequency(category: string): ProcessedAsset['maintenance']['schedule']['frequency'] {
    const frequencyMap: Record<string, ProcessedAsset['maintenance']['schedule']['frequency']> = {
      'electronics': 'quarterly',
      'appliances': 'monthly',
      'furniture': 'quarterly',
      'fixtures': 'monthly',
      'linen': 'weekly',
      'hvac': 'monthly'
    };

    return frequencyMap[category] || 'quarterly';
  }

  private calculateNextMaintenance(category: string): Date {
    const frequency = this.getMaintenanceFrequency(category);
    const now = new Date();

    const intervalMap: Record<string, number> = {
      'daily': 1,
      'weekly': 7,
      'monthly': 30,
      'quarterly': 90,
      'annually': 365,
      'as_needed': 180
    };

    const days = intervalMap[frequency] || 90;
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private isIoTCapable(category: string): boolean {
    const iotCategories = ['electronics', 'appliances', 'hvac', 'lighting', 'security'];
    return iotCategories.includes(category);
  }

  private generateIoTSensors(category: string): ProcessedAsset['digital']['iotSensorData'] {
    const sensorMap: Record<string, Array<{ sensorType: string; thresholds: any }>> = {
      'electronics': [
        { sensorType: 'temperature', thresholds: { max: 85, alerts: true } },
        { sensorType: 'power_consumption', thresholds: { max: 200, alerts: true } }
      ],
      'appliances': [
        { sensorType: 'vibration', thresholds: { max: 5, alerts: true } },
        { sensorType: 'temperature', thresholds: { max: 150, alerts: true } }
      ],
      'hvac': [
        { sensorType: 'temperature', thresholds: { min: 65, max: 85, alerts: true } },
        { sensorType: 'air_quality', thresholds: { min: 80, alerts: true } }
      ]
    };

    const sensors = sensorMap[category] || [];
    return sensors.map(sensor => ({
      ...sensor,
      lastReading: Math.random() * 100,
      lastUpdated: new Date()
    }));
  }

  private getExpectedLifespan(category: string): number {
    const lifespanMap: Record<string, number> = {
      'electronics': 5,
      'appliances': 10,
      'furniture': 15,
      'fixtures': 20,
      'linen': 2,
      'lighting': 5,
      'hvac': 15
    };

    return lifespanMap[category] || 10;
  }

  private getRequiredCertifications(category: string): string[] {
    const certificationMap: Record<string, string[]> = {
      'electronics': ['FCC', 'Energy Star'],
      'appliances': ['UL Listed', 'Energy Star'],
      'furniture': ['GREENGUARD'],
      'fixtures': ['WaterSense', 'ADA Compliant'],
      'lighting': ['Energy Star', 'DLC Listed']
    };

    return certificationMap[category] || [];
  }

  private async updateRoomInventory(roomId: ObjectId, asset: ProcessedAsset): Promise<void> {
    await this.db.collection('rooms').updateOne(
      { _id: roomId },
      {
        $push: {
          inventory: {
            itemId: asset.qrCode,
            name: asset.name,
            category: asset.category,
            quantity: 1,
            condition: asset.condition.overall,
            lastChecked: new Date()
          }
        },
        $set: { updatedAt: new Date() }
      }
    );
  }

  private logImport(
    rowNumber: number,
    assetName: string,
    roomNumber: string,
    status: 'success' | 'error' | 'skipped',
    message: string
  ) {
    this.importLog.push({
      rowNumber,
      assetName,
      roomNumber,
      status,
      message,
      timestamp: new Date()
    });
  }

  private async saveImportLog(batchId: string, source: string) {
    await this.db.collection('import_logs').insertOne({
      type: 'asset_import',
      batchId,
      source,
      timestamp: new Date(),
      logs: this.importLog,
      summary: {
        total: this.importLog.length,
        success: this.importLog.filter(l => l.status === 'success').length,
        errors: this.importLog.filter(l => l.status === 'error').length,
        skipped: this.importLog.filter(l => l.status === 'skipped').length
      }
    });
  }

  async generateSampleTemplate(): Promise<AssetImportRow[]> {
    return [
      {
        roomNumber: '101',
        assetName: 'Samsung Smart TV 55"',
        category: 'electronics',
        brand: 'Samsung',
        model: 'UN55TU8000',
        serialNumber: 'SN123456789',
        purchaseDate: '2023-01-15',
        purchasePrice: '799.99',
        supplier: 'Best Buy',
        warrantyExpiry: '2026-01-15',
        condition: 'excellent',
        location: 'Living area wall mount',
        notes: 'Wall mounted with full motion bracket',
        qrCode: 'ASSET-101-TV-0001'
      },
      {
        roomNumber: '101',
        assetName: 'King Size Bed',
        category: 'furniture',
        brand: 'Sleep Number',
        model: 'i8 Smart Bed',
        serialNumber: 'BED789123',
        purchaseDate: '2022-06-01',
        purchasePrice: '2499.99',
        supplier: 'Sleep Number Store',
        warrantyExpiry: '2032-06-01',
        condition: 'good',
        location: 'Center of bedroom',
        notes: 'Memory foam mattress with smart features'
      }
    ];
  }
}

// CLI usage functions
export async function runAssetImport(filePath: string, fileType: 'excel' | 'csv' | 'json') {
  const importer = new AssetImportUtility();
  await importer.initialize();

  try {
    let result;
    switch (fileType) {
      case 'excel':
        result = await importer.importFromExcel(filePath);
        break;
      case 'csv':
        result = await importer.importFromCSV(filePath);
        break;
      case 'json':
        const jsonData = JSON.parse(readFileSync(filePath, 'utf8'));
        result = await importer.importFromJSON(jsonData);
        break;
      default:
        throw new Error('Unsupported file type');
    }

    console.log('Asset import completed:', result);
    return result;
  } catch (error) {
    console.error('Asset import failed:', error);
    throw error;
  }
}