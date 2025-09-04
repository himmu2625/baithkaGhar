import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/utils/dbConnect';
import EventLead from '@/models/EventLead';
import { apiHandler } from '@/lib/utils/apiHandler';

// GET /api/events/leads - Get all leads for a property
export async function GET(request: NextRequest) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assignedTo');
    const priority = searchParams.get('priority');
    const source = searchParams.get('source');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Build query
    const query: any = { propertyId, isActive: true };
    
    if (status) {
      query.status = status;
    }
    
    if (assignedTo) {
      query.assignedTo = assignedTo;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    if (source) {
      query.source = source;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [leads, totalCount] = await Promise.all([
      EventLead.find(query)
        .populate('assignedTo', 'name email')
        .populate('conversionData.bookingId', 'bookingNumber eventName')
        .sort({ leadScore: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EventLead.countDocuments(query)
    ]);

    // Calculate additional metrics
    const stats = await EventLead.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          averageLeadScore: { $avg: '$leadScore' },
          totalConversions: { 
            $sum: { $cond: ['$conversionData.convertedToBooking', 1, 0] }
          },
          totalValue: { 
            $sum: { $ifNull: ['$conversionData.conversionValue', 0] }
          },
          statusBreakdown: {
            $push: {
              status: '$status',
              count: 1
            }
          }
        }
      }
    ]);

    const conversionRate = totalCount > 0 ? (stats[0]?.totalConversions / totalCount * 100) : 0;

    return NextResponse.json({
      leads,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + leads.length < totalCount
      },
      stats: {
        totalLeads: totalCount,
        averageLeadScore: Math.round(stats[0]?.averageLeadScore || 0),
        conversionRate: Math.round(conversionRate * 100) / 100,
        totalConversions: stats[0]?.totalConversions || 0,
        totalValue: stats[0]?.totalValue || 0
      }
    });
  });
}

// POST /api/events/leads - Create a new lead
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
      source,
      sourceDetails,
      referredBy,
      client,
      eventRequirements,
      priority = 'normal',
      assignedTo,
      tags = []
    } = body;

    // Validation
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    if (!source || !client?.name || !client?.email || !client?.phone) {
      return NextResponse.json({ 
        error: 'Source and complete client information (name, email, phone) are required' 
      }, { status: 400 });
    }

    if (!eventRequirements?.eventType || !eventRequirements?.expectedGuests) {
      return NextResponse.json({ 
        error: 'Event requirements (type and guest count) are required' 
      }, { status: 400 });
    }

    // Check for duplicate leads (same email and property)
    const existingLead = await EventLead.findOne({
      propertyId,
      'client.email': client.email,
      isActive: true,
      status: { $nin: ['won', 'lost'] }
    });

    if (existingLead) {
      return NextResponse.json({ 
        error: 'An active lead already exists for this client' 
      }, { status: 409 });
    }

    // Calculate initial lead score factors
    const scoreFactors = {
      budgetFit: calculateBudgetFit(eventRequirements.budget),
      timingUrgency: calculateTimingUrgency(eventRequirements.preferredDates),
      decisionMakerContact: true, // Assume first contact is decision maker
      competitorInvolvement: false, // Unknown initially
      eventComplexity: calculateEventComplexity(eventRequirements)
    };

    // Create lead
    const leadData = {
      propertyId,
      source,
      sourceDetails,
      referredBy,
      client,
      eventRequirements,
      priority,
      assignedTo: assignedTo || session.user.id,
      assignedDate: new Date(),
      scoreFactors,
      tags,
      createdBy: session.user.id,
      responseTime: 0 // Will be calculated when first interaction is added
    };

    const lead = new EventLead(leadData);
    await lead.save();

    // Populate the response
    await lead.populate('assignedTo', 'name email');

    return NextResponse.json({ 
      lead,
      message: 'Lead created successfully' 
    }, { status: 201 });
  });
}

// Helper functions
function calculateBudgetFit(budget: any): number {
  if (!budget || (!budget.min && !budget.max)) return 50;
  
  // This would typically compare against venue/service pricing
  // For now, return a score based on budget range
  const avgBudget = ((budget.min || 0) + (budget.max || budget.min || 100000)) / 2;
  
  if (avgBudget >= 500000) return 90;
  if (avgBudget >= 200000) return 80;
  if (avgBudget >= 100000) return 70;
  if (avgBudget >= 50000) return 60;
  return 40;
}

function calculateTimingUrgency(preferredDates: Date[]): number {
  if (!preferredDates || preferredDates.length === 0) return 30;
  
  const nearestDate = new Date(Math.min(...preferredDates.map(d => new Date(d).getTime())));
  const daysFromNow = Math.ceil((nearestDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (daysFromNow <= 30) return 90;
  if (daysFromNow <= 60) return 80;
  if (daysFromNow <= 90) return 70;
  if (daysFromNow <= 180) return 60;
  return 40;
}

function calculateEventComplexity(eventRequirements: any): number {
  let complexity = 30; // Base complexity
  
  if (eventRequirements.cateringRequired) complexity += 20;
  if (eventRequirements.decorationRequired) complexity += 15;
  if (eventRequirements.accommodationRequired) complexity += 15;
  if (eventRequirements.transportationRequired) complexity += 10;
  if (eventRequirements.specialRequirements) complexity += 10;
  
  // Adjust based on guest count
  const guestCount = eventRequirements.expectedGuests?.max || eventRequirements.expectedGuests?.min || 0;
  if (guestCount > 500) complexity += 20;
  else if (guestCount > 200) complexity += 15;
  else if (guestCount > 100) complexity += 10;
  
  // Adjust based on event type
  if (['wedding', 'corporate'].includes(eventRequirements.eventType)) {
    complexity += 15;
  }
  
  return Math.min(100, complexity);
}