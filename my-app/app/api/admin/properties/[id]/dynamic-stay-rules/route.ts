import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { connectMongo } from '@/lib/db/mongodb';
import Property from '@/models/Property';
import { v4 as uuidv4 } from 'uuid';

interface DynamicStayRule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  minStay: number;
  maxStay?: number;
  triggerType: 'season' | 'demand' | 'occupancy' | 'event' | 'custom';
  triggerCondition?: {
    occupancyThreshold?: number;
    demandLevel?: 'low' | 'medium' | 'high';
    eventType?: string;
  };
  priority: number;
  isActive: boolean;
  description?: string;
}

interface BookingWindowRule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  minAdvanceBooking: number;
  maxAdvanceBooking?: number;
  lastMinuteBooking: boolean;
  triggerType: 'season' | 'demand' | 'occupancy' | 'event' | 'custom';
  triggerCondition?: {
    occupancyThreshold?: number;
    demandLevel?: 'low' | 'medium' | 'high';
    eventType?: string;
  };
  priority: number;
  isActive: boolean;
  description?: string;
}

interface DynamicStayRulesConfig {
  enabled: boolean;
  minimumStayRules: DynamicStayRule[];
  bookingWindowRules: BookingWindowRule[];
  defaultRules: {
    minStay: number;
    maxStay?: number;
    minAdvanceBooking: number;
    maxAdvanceBooking?: number;
    lastMinuteBooking: boolean;
  };
}

// GET: Fetch dynamic stay rules for a property
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectMongo();

  try {
    // Check authentication and admin permissions
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = params;

    const property = await Property.findById(id).select('dynamicPricing.dynamicStayRules title');
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const dynamicStayRules = property.dynamicPricing?.dynamicStayRules || {
      enabled: false,
      minimumStayRules: [],
      bookingWindowRules: [],
      defaultRules: {
        minStay: 1,
        maxStay: undefined,
        minAdvanceBooking: 0,
        maxAdvanceBooking: undefined,
        lastMinuteBooking: true
      }
    };

    return NextResponse.json({
      success: true,
      dynamicStayRules,
      propertyTitle: property.title
    });

  } catch (error) {
    console.error('Error fetching dynamic stay rules:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT: Update dynamic stay rules for a property
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectMongo();

  try {
    // Check authentication and admin permissions
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = params;
    const body: DynamicStayRulesConfig = await req.json();

    // Validate the request body
    const validation = validateDynamicStayRules(body);
    if (!validation.isValid) {
      return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 400 });
    }

    const property = await Property.findById(id);
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Initialize dynamicPricing if it doesn't exist
    if (!property.dynamicPricing) {
      property.dynamicPricing = {
        enabled: false,
        basePrice: property.price?.base || 0,
        minPrice: 0,
        maxPrice: 0,
        seasonalRates: {
          peak: { multiplier: 1.3, months: [11, 12, 1, 2] },
          offPeak: { multiplier: 0.8, months: [6, 7, 8, 9] },
          shoulder: { multiplier: 1.0, months: [3, 4, 5, 10] }
        },
        weeklyRates: {
          monday: 1.0,
          tuesday: 1.0,
          wednesday: 1.0,
          thursday: 1.0,
          friday: 1.2,
          saturday: 1.3,
          sunday: 1.2
        },
        demandPricing: {
          lowOccupancy: 0.9,
          mediumOccupancy: 1.0,
          highOccupancy: 1.2
        },
        competitionSensitivity: 0.1,
        advanceBookingDiscounts: {
          "30+ days": 0.1,
          "15-30 days": 0.05,
          "7-15 days": 0.02,
          "1-7 days": 0
        },
        eventPricing: {
          localEvents: 1.2,
          festivals: 1.5,
          conferences: 1.3
        },
        lastMinutePremium: 1.1,
        autoPricing: {
          enabled: false,
          minMultiplier: 0.7,
          maxMultiplier: 2.0
        }
      };
    }

    // Update dynamic stay rules
    property.dynamicPricing.dynamicStayRules = body;

    await property.save();

    return NextResponse.json({
      success: true,
      message: 'Dynamic stay rules updated successfully',
      dynamicStayRules: property.dynamicPricing.dynamicStayRules
    });

  } catch (error) {
    console.error('Error updating dynamic stay rules:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST: Add a new minimum stay rule
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectMongo();

  try {
    // Check authentication and admin permissions
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin' && session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = params;
    const { ruleType, rule } = await req.json();

    if (!ruleType || !rule) {
      return NextResponse.json({ error: 'ruleType and rule are required' }, { status: 400 });
    }

    if (ruleType !== 'minimumStay' && ruleType !== 'bookingWindow') {
      return NextResponse.json({ error: 'Invalid ruleType. Must be "minimumStay" or "bookingWindow"' }, { status: 400 });
    }

    const property = await Property.findById(id);
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Initialize dynamic stay rules if they don't exist
    if (!property.dynamicPricing) {
      property.dynamicPricing = {} as any;
    }
    // Type guard to ensure dynamicPricing is always defined
    if (!property.dynamicPricing) {
      throw new Error('property.dynamicPricing is undefined after initialization');
    }
    if (!property.dynamicPricing!.dynamicStayRules) {
      property.dynamicPricing!.dynamicStayRules = {
        enabled: true,
        minimumStayRules: [],
        bookingWindowRules: [],
        defaultRules: {
          minStay: 1,
          minAdvanceBooking: 0,
          lastMinuteBooking: true
        }
      };
    }

    // Generate unique ID for the new rule
    const newRule = {
      ...rule,
      id: uuidv4(),
      priority: rule.priority || 1,
      isActive: rule.isActive !== undefined ? rule.isActive : true
    };

    // Add rule to appropriate array
    if (ruleType === 'minimumStay') {
      property.dynamicPricing!.dynamicStayRules.minimumStayRules.push(newRule);
    } else {
      property.dynamicPricing!.dynamicStayRules.bookingWindowRules.push(newRule);
    }

    await property.save();

    return NextResponse.json({
      success: true,
      message: `${ruleType} rule added successfully`,
      rule: newRule
    });

  } catch (error) {
    console.error('Error adding dynamic stay rule:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Validation function for dynamic stay rules
function validateDynamicStayRules(rules: DynamicStayRulesConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof rules.enabled !== 'boolean') {
    errors.push('enabled must be a boolean');
  }

  // Validate minimum stay rules
  if (!Array.isArray(rules.minimumStayRules)) {
    errors.push('minimumStayRules must be an array');
  } else {
    rules.minimumStayRules.forEach((rule, index) => {
      if (!rule.id || typeof rule.id !== 'string') {
        errors.push(`minimumStayRules[${index}].id is required and must be a string`);
      }
      if (!rule.name || typeof rule.name !== 'string') {
        errors.push(`minimumStayRules[${index}].name is required and must be a string`);
      }
      if (!rule.startDate || typeof rule.startDate !== 'string') {
        errors.push(`minimumStayRules[${index}].startDate is required and must be a string`);
      }
      if (!rule.endDate || typeof rule.endDate !== 'string') {
        errors.push(`minimumStayRules[${index}].endDate is required and must be a string`);
      }
      if (typeof rule.minStay !== 'number' || rule.minStay < 1) {
        errors.push(`minimumStayRules[${index}].minStay must be a number >= 1`);
      }
      if (rule.maxStay !== undefined && (typeof rule.maxStay !== 'number' || rule.maxStay < rule.minStay)) {
        errors.push(`minimumStayRules[${index}].maxStay must be a number >= minStay`);
      }
      if (!['season', 'demand', 'occupancy', 'event', 'custom'].includes(rule.triggerType)) {
        errors.push(`minimumStayRules[${index}].triggerType must be one of: season, demand, occupancy, event, custom`);
      }
      if (typeof rule.priority !== 'number') {
        errors.push(`minimumStayRules[${index}].priority must be a number`);
      }
      if (typeof rule.isActive !== 'boolean') {
        errors.push(`minimumStayRules[${index}].isActive must be a boolean`);
      }
    });
  }

  // Validate booking window rules
  if (!Array.isArray(rules.bookingWindowRules)) {
    errors.push('bookingWindowRules must be an array');
  } else {
    rules.bookingWindowRules.forEach((rule, index) => {
      if (!rule.id || typeof rule.id !== 'string') {
        errors.push(`bookingWindowRules[${index}].id is required and must be a string`);
      }
      if (!rule.name || typeof rule.name !== 'string') {
        errors.push(`bookingWindowRules[${index}].name is required and must be a string`);
      }
      if (!rule.startDate || typeof rule.startDate !== 'string') {
        errors.push(`bookingWindowRules[${index}].startDate is required and must be a string`);
      }
      if (!rule.endDate || typeof rule.endDate !== 'string') {
        errors.push(`bookingWindowRules[${index}].endDate is required and must be a string`);
      }
      if (typeof rule.minAdvanceBooking !== 'number' || rule.minAdvanceBooking < 0) {
        errors.push(`bookingWindowRules[${index}].minAdvanceBooking must be a number >= 0`);
      }
      if (rule.maxAdvanceBooking !== undefined && (typeof rule.maxAdvanceBooking !== 'number' || rule.maxAdvanceBooking < rule.minAdvanceBooking)) {
        errors.push(`bookingWindowRules[${index}].maxAdvanceBooking must be a number >= minAdvanceBooking`);
      }
      if (typeof rule.lastMinuteBooking !== 'boolean') {
        errors.push(`bookingWindowRules[${index}].lastMinuteBooking must be a boolean`);
      }
      if (!['season', 'demand', 'occupancy', 'event', 'custom'].includes(rule.triggerType)) {
        errors.push(`bookingWindowRules[${index}].triggerType must be one of: season, demand, occupancy, event, custom`);
      }
      if (typeof rule.priority !== 'number') {
        errors.push(`bookingWindowRules[${index}].priority must be a number`);
      }
      if (typeof rule.isActive !== 'boolean') {
        errors.push(`bookingWindowRules[${index}].isActive must be a boolean`);
      }
    });
  }

  // Validate default rules
  if (!rules.defaultRules || typeof rules.defaultRules !== 'object') {
    errors.push('defaultRules is required and must be an object');
  } else {
    if (typeof rules.defaultRules.minStay !== 'number' || rules.defaultRules.minStay < 1) {
      errors.push('defaultRules.minStay must be a number >= 1');
    }
    if (rules.defaultRules.maxStay !== undefined && (typeof rules.defaultRules.maxStay !== 'number' || rules.defaultRules.maxStay < rules.defaultRules.minStay)) {
      errors.push('defaultRules.maxStay must be a number >= minStay');
    }
    if (typeof rules.defaultRules.minAdvanceBooking !== 'number' || rules.defaultRules.minAdvanceBooking < 0) {
      errors.push('defaultRules.minAdvanceBooking must be a number >= 0');
    }
    if (rules.defaultRules.maxAdvanceBooking !== undefined && (typeof rules.defaultRules.maxAdvanceBooking !== 'number' || rules.defaultRules.maxAdvanceBooking < rules.defaultRules.minAdvanceBooking)) {
      errors.push('defaultRules.maxAdvanceBooking must be a number >= minAdvanceBooking');
    }
    if (typeof rules.defaultRules.lastMinuteBooking !== 'boolean') {
      errors.push('defaultRules.lastMinuteBooking must be a boolean');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
} 