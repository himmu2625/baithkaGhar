import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/utils/dbConnect';
import EventFeedback from '@/models/EventFeedback';
import EventBooking from '@/models/EventBooking';
import { apiHandler } from '@/lib/utils/apiHandler';

// GET /api/events/feedback - Get feedback for property
export async function GET(request: NextRequest) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const eventBookingId = searchParams.get('eventBookingId');
    const status = searchParams.get('status');
    const dateRange = searchParams.get('dateRange'); // 'week', 'month', 'quarter', 'year'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Build query
    const query: any = { propertyId, isActive: true };
    
    if (eventBookingId) {
      query.eventBookingId = eventBookingId;
    }
    
    if (status) {
      query.status = status;
    }

    // Date range filter
    if (dateRange) {
      const now = new Date();
      let startDate = new Date();
      
      switch (dateRange) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      query.createdAt = { $gte: startDate };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    
    const [feedbacks, totalCount] = await Promise.all([
      EventFeedback.find(query)
        .populate('eventBookingId', 'bookingNumber eventName eventType')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      EventFeedback.countDocuments(query)
    ]);

    // Calculate aggregate statistics
    const stats = await EventFeedback.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageOverallSatisfaction: { 
            $avg: '$overallRatings.overallSatisfaction' 
          },
          averageNPS: { 
            $avg: '$npsData.score' 
          },
          completedFeedbacks: { 
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          promoters: { 
            $sum: { $cond: [{ $eq: ['$npsData.category', 'promoter'] }, 1, 0] }
          },
          passives: { 
            $sum: { $cond: [{ $eq: ['$npsData.category', 'passive'] }, 1, 0] }
          },
          detractors: { 
            $sum: { $cond: [{ $eq: ['$npsData.category', 'detractor'] }, 1, 0] }
          },
          totalIssues: { 
            $sum: { $size: { $ifNull: ['$issues', []] } }
          },
          resolvedIssues: { 
            $sum: {
              $size: {
                $filter: {
                  input: { $ifNull: ['$issues', []] },
                  cond: { $eq: ['$$this.status', 'resolved'] }
                }
              }
            }
          }
        }
      }
    ]);

    const aggregateStats = stats[0] || {};
    const npsScore = aggregateStats.totalFeedbacks > 0 
      ? Math.round(((aggregateStats.promoters - aggregateStats.detractors) / aggregateStats.totalFeedbacks) * 100)
      : 0;

    return NextResponse.json({
      feedbacks,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + feedbacks.length < totalCount
      },
      stats: {
        totalFeedbacks: aggregateStats.totalFeedbacks || 0,
        completionRate: aggregateStats.totalFeedbacks > 0 
          ? Math.round((aggregateStats.completedFeedbacks / aggregateStats.totalFeedbacks) * 100)
          : 0,
        averageOverallSatisfaction: Math.round((aggregateStats.averageOverallSatisfaction || 0) * 10) / 10,
        npsScore,
        promoters: aggregateStats.promoters || 0,
        passives: aggregateStats.passives || 0,
        detractors: aggregateStats.detractors || 0,
        totalIssues: aggregateStats.totalIssues || 0,
        issueResolutionRate: aggregateStats.totalIssues > 0 
          ? Math.round((aggregateStats.resolvedIssues / aggregateStats.totalIssues) * 100)
          : 0
      }
    });
  });
}

// POST /api/events/feedback - Create feedback request
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
      eventBookingId,
      collectionMethod = 'email',
      autoFollowUp = true,
      maxReminders = 3,
      reminderInterval = 24,
      incentive
    } = body;

    // Validation
    if (!propertyId || !eventBookingId) {
      return NextResponse.json({ 
        error: 'Property ID and Event Booking ID are required' 
      }, { status: 400 });
    }

    // Get event booking details
    const eventBooking = await EventBooking.findById(eventBookingId);
    if (!eventBooking) {
      return NextResponse.json({ error: 'Event booking not found' }, { status: 404 });
    }

    // Check if feedback already exists
    const existingFeedback = await EventFeedback.findOne({ eventBookingId });
    if (existingFeedback) {
      return NextResponse.json({ 
        error: 'Feedback request already exists for this event' 
      }, { status: 409 });
    }

    // Create feedback request
    const feedbackData = {
      propertyId,
      eventBookingId,
      eventDetails: {
        eventName: eventBooking.eventName,
        eventDate: eventBooking.eventDate,
        eventType: eventBooking.eventType,
        venueId: eventBooking.venueId,
        venueName: eventBooking.venue?.venueName || 'Unknown Venue'
      },
      client: {
        name: eventBooking.organizer.name,
        email: eventBooking.organizer.email,
        phone: eventBooking.organizer.phone,
        company: eventBooking.organizer.company
      },
      feedbackConfig: {
        collectionMethod,
        autoFollowUp,
        maxReminders,
        reminderInterval,
        remindersSent: 0,
        incentiveOffered: incentive
      },
      status: 'pending',
      createdBy: session.user.id
    };

    const feedback = new EventFeedback(feedbackData);
    await feedback.save();

    // Send initial feedback request
    await sendFeedbackRequest(feedback, collectionMethod);

    // Populate response
    await feedback.populate('eventBookingId', 'bookingNumber eventName');

    return NextResponse.json({ 
      feedback,
      message: 'Feedback request created and sent successfully' 
    }, { status: 201 });
  });
}

// Helper function to send feedback request
async function sendFeedbackRequest(feedback: any, method: string) {
  // Update feedback config
  feedback.feedbackConfig.sentDate = new Date();
  await feedback.save();

  // Implementation would send actual request via email, SMS, etc.
  // For now, we'll just log the action
  console.log(`Feedback request sent via ${method} to ${feedback.client.email}`);
  
  return true;
}