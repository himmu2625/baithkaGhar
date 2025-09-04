import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/utils/dbConnect';
import EventAutomation from '@/models/EventAutomation';
import { apiHandler } from '@/lib/utils/apiHandler';

// GET /api/events/automation - Get automations for property
export async function GET(request: NextRequest) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const automationType = searchParams.get('automationType');
    const isActive = searchParams.get('isActive');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Build query
    const query: any = { propertyId };
    
    if (automationType) {
      query.automationType = automationType;
    }
    
    if (isActive !== null) {
      query.isActive = isActive === 'true';
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [automations, totalCount] = await Promise.all([
      EventAutomation.find(query)
        .populate('createdBy', 'name email')
        .populate('lastModifiedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EventAutomation.countDocuments(query)
    ]);

    // Calculate aggregate statistics
    const stats = await EventAutomation.aggregate([
      { $match: { propertyId } },
      {
        $group: {
          _id: null,
          totalAutomations: { $sum: 1 },
          activeAutomations: { 
            $sum: { $cond: ['$isActive', 1, 0] }
          },
          totalExecutions: { $sum: '$analytics.totalExecutions' },
          totalSuccessfulExecutions: { $sum: '$analytics.successfulExecutions' },
          totalTriggers: { $sum: '$analytics.totalTriggers' },
          
          // Group by automation type
          emailAutomations: { 
            $sum: { $cond: [{ $eq: ['$automationType', 'email'] }, 1, 0] }
          },
          smsAutomations: { 
            $sum: { $cond: [{ $eq: ['$automationType', 'sms'] }, 1, 0] }
          },
          workflowAutomations: { 
            $sum: { $cond: [{ $eq: ['$automationType', 'workflow'] }, 1, 0] }
          }
        }
      }
    ]);

    const aggregateStats = stats[0] || {};
    const successRate = aggregateStats.totalExecutions > 0 
      ? Math.round((aggregateStats.totalSuccessfulExecutions / aggregateStats.totalExecutions) * 100)
      : 0;

    return NextResponse.json({
      automations,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + automations.length < totalCount
      },
      stats: {
        totalAutomations: aggregateStats.totalAutomations || 0,
        activeAutomations: aggregateStats.activeAutomations || 0,
        totalExecutions: aggregateStats.totalExecutions || 0,
        successRate,
        totalTriggers: aggregateStats.totalTriggers || 0,
        typeBreakdown: {
          email: aggregateStats.emailAutomations || 0,
          sms: aggregateStats.smsAutomations || 0,
          workflow: aggregateStats.workflowAutomations || 0
        }
      }
    });
  });
}

// POST /api/events/automation - Create new automation
export async function POST(request: NextRequest) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const body = await request.json();
    const {
      propertyId,
      automationName,
      automationType,
      triggers,
      targetAudience,
      messageConfig,
      executionConfig,
      integrationSettings
    } = body;

    // Validation
    if (!propertyId || !automationName || !automationType) {
      return NextResponse.json({ 
        error: 'Property ID, automation name, and type are required' 
      }, { status: 400 });
    }

    if (!triggers || triggers.length === 0) {
      return NextResponse.json({ 
        error: 'At least one trigger is required' 
      }, { status: 400 });
    }

    if (!targetAudience || !targetAudience.recipientType) {
      return NextResponse.json({ 
        error: 'Target audience is required' 
      }, { status: 400 });
    }

    // Validate automation type specific requirements
    if (automationType === 'email' && !messageConfig?.emailConfig) {
      return NextResponse.json({ 
        error: 'Email configuration is required for email automation' 
      }, { status: 400 });
    }

    if (automationType === 'sms' && !messageConfig?.smsConfig) {
      return NextResponse.json({ 
        error: 'SMS configuration is required for SMS automation' 
      }, { status: 400 });
    }

    // Check for duplicate automation names
    const existingAutomation = await EventAutomation.findOne({
      propertyId,
      automationName,
      isActive: true
    });

    if (existingAutomation) {
      return NextResponse.json({ 
        error: 'An automation with this name already exists' 
      }, { status: 409 });
    }

    // Create automation
    const automationData = {
      propertyId,
      automationName,
      automationType,
      triggers,
      targetAudience,
      messageConfig,
      executionConfig: {
        isActive: true,
        priority: 'normal',
        maxRetries: 3,
        retryInterval: 30,
        failureAction: 'stop',
        ...executionConfig
      },
      integrationSettings: {
        emailProvider: 'smtp',
        ...integrationSettings
      },
      compliance: {
        gdprCompliant: true,
        consentRequired: false,
        optOutEnabled: true,
        dataRetention: 365,
        unsubscribeLink: true
      },
      analytics: {
        totalTriggers: 0,
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        dailyStats: [],
        engagementMetrics: {
          openRate: 0,
          clickRate: 0,
          responseRate: 0,
          conversionRate: 0
        }
      },
      executionHistory: [],
      createdBy: session.user.id,
      isActive: true,
      tags: []
    };

    const automation = new EventAutomation(automationData);
    await automation.save();

    // Populate response
    await automation.populate('createdBy', 'name email');

    return NextResponse.json({ 
      automation,
      message: 'Automation created successfully' 
    }, { status: 201 });
  });
}