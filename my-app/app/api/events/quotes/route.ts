import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/utils/dbConnect';
import EventQuote from '@/models/EventQuote';
import EventLead from '@/models/EventLead';
import { apiHandler } from '@/lib/utils/apiHandler';

// GET /api/events/quotes - Get all quotes for a property
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
    const leadId = searchParams.get('leadId');
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
    
    if (leadId) {
      query.leadId = leadId;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [quotes, totalCount] = await Promise.all([
      EventQuote.find(query)
        .populate('assignedTo', 'name email')
        .populate('leadId', 'leadNumber client.name client.email')
        .populate('eventBookingId', 'bookingNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EventQuote.countDocuments(query)
    ]);

    // Calculate stats
    const stats = await EventQuote.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$pricing.totalAmount' },
          averageValue: { $avg: '$pricing.totalAmount' },
          acceptedQuotes: { 
            $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] }
          },
          rejectedQuotes: { 
            $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
          },
          expiredQuotes: { 
            $sum: { $cond: [{ $eq: ['$status', 'expired'] }, 1, 0] }
          }
        }
      }
    ]);

    const conversionRate = totalCount > 0 ? (stats[0]?.acceptedQuotes / totalCount * 100) : 0;

    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + quotes.length < totalCount
      },
      stats: {
        totalQuotes: totalCount,
        totalValue: stats[0]?.totalValue || 0,
        averageValue: Math.round(stats[0]?.averageValue || 0),
        conversionRate: Math.round(conversionRate * 100) / 100,
        acceptedQuotes: stats[0]?.acceptedQuotes || 0,
        rejectedQuotes: stats[0]?.rejectedQuotes || 0,
        expiredQuotes: stats[0]?.expiredQuotes || 0
      }
    });
  });
}

// POST /api/events/quotes - Create a new quote
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
      leadId,
      eventBookingId,
      client,
      eventDetails,
      venue,
      selectedPackage,
      additionalServices = [],
      catering,
      pricing,
      paymentTerms,
      terms,
      validityDays = 30
    } = body;

    // Validation
    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    if (!client?.name || !client?.email || !client?.phone) {
      return NextResponse.json({ 
        error: 'Complete client information (name, email, phone) is required' 
      }, { status: 400 });
    }

    if (!eventDetails?.eventType || !eventDetails?.eventName || !eventDetails?.eventDate) {
      return NextResponse.json({ 
        error: 'Event details (type, name, date) are required' 
      }, { status: 400 });
    }

    if (!venue?.venueId || !venue?.venueName) {
      return NextResponse.json({ 
        error: 'Venue information is required' 
      }, { status: 400 });
    }

    if (!pricing?.totalAmount || pricing.totalAmount <= 0) {
      return NextResponse.json({ 
        error: 'Valid pricing information is required' 
      }, { status: 400 });
    }

    // Set validity period
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validityDays);

    // Create quote
    const quoteData = {
      propertyId,
      leadId,
      eventBookingId,
      client,
      eventDetails,
      venue,
      selectedPackage,
      additionalServices,
      catering,
      pricing: {
        ...pricing,
        currency: pricing.currency || 'INR'
      },
      paymentTerms: {
        ...paymentTerms,
        advancePercentage: paymentTerms?.advancePercentage || 50,
        balancePaymentDays: paymentTerms?.balancePaymentDays || 7,
        paymentMethods: paymentTerms?.paymentMethods || ['bank-transfer', 'card', 'upi'],
        cancellationPolicy: paymentTerms?.cancellationPolicy || 'Standard cancellation policy applies',
        refundPolicy: paymentTerms?.refundPolicy || 'Refunds subject to cancellation policy'
      },
      terms: {
        inclusions: terms?.inclusions || [],
        exclusions: terms?.exclusions || [],
        conditions: terms?.conditions || [],
        cancellationTerms: terms?.cancellationTerms || 'Standard terms apply',
        ...terms
      },
      validityPeriod: {
        validFrom: new Date(),
        validUntil,
        isExpired: false
      },
      assignedTo: session.user.id,
      createdBy: session.user.id
    };

    const quote = new EventQuote(quoteData);
    await quote.save();

    // Update lead status if associated
    if (leadId) {
      const lead = await EventLead.findById(leadId);
      if (lead) {
        await lead.generateQuotation({
          quotationNumber: quote.quoteNumber,
          sentDate: new Date(),
          validUntil,
          amount: pricing.totalAmount,
          currency: pricing.currency || 'INR',
          status: 'draft'
        });
      }
    }

    // Populate the response
    await quote.populate('assignedTo', 'name email');
    if (leadId) {
      await quote.populate('leadId', 'leadNumber client.name');
    }

    return NextResponse.json({ 
      quote,
      message: 'Quote created successfully' 
    }, { status: 201 });
  });
}