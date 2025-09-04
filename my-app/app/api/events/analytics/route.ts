import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/utils/dbConnect';
import EventBooking from '@/models/EventBooking';
import EventLead from '@/models/EventLead';
import EventQuote from '@/models/EventQuote';
import EventFeedback from '@/models/EventFeedback';
import { apiHandler } from '@/lib/utils/apiHandler';

// GET /api/events/analytics - Get comprehensive event analytics
export async function GET(request: NextRequest) {
  return apiHandler(async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const period = searchParams.get('period') || 'month'; // 'week', 'month', 'quarter', 'year'
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Calculate date range
    let dateRange: { $gte: Date; $lte?: Date } = { $gte: new Date() };
    
    if (startDate && endDate) {
      dateRange = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      const now = new Date();
      const start = new Date();
      
      switch (period) {
        case 'week':
          start.setDate(now.getDate() - 7);
          break;
        case 'month':
          start.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          start.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          start.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      dateRange = { $gte: start, $lte: now };
    }

    // Parallel execution of all analytics queries
    const [
      bookingAnalytics,
      leadAnalytics,
      quoteAnalytics,
      feedbackAnalytics,
      revenueAnalytics,
      venueAnalytics,
      customerAnalytics,
      performanceAnalytics
    ] = await Promise.all([
      getBookingAnalytics(propertyId, dateRange),
      getLeadAnalytics(propertyId, dateRange),
      getQuoteAnalytics(propertyId, dateRange),
      getFeedbackAnalytics(propertyId, dateRange),
      getRevenueAnalytics(propertyId, dateRange),
      getVenueAnalytics(propertyId, dateRange),
      getCustomerAnalytics(propertyId, dateRange),
      getPerformanceAnalytics(propertyId, dateRange)
    ]);

    return NextResponse.json({
      summary: {
        totalBookings: bookingAnalytics.total,
        totalRevenue: revenueAnalytics.totalRevenue,
        averageBookingValue: revenueAnalytics.averageBookingValue,
        conversionRate: leadAnalytics.conversionRate,
        customerSatisfaction: feedbackAnalytics.averageSatisfaction,
        period,
        dateRange: {
          start: dateRange.$gte,
          end: dateRange.$lte || new Date()
        }
      },
      bookings: bookingAnalytics,
      leads: leadAnalytics,
      quotes: quoteAnalytics,
      feedback: feedbackAnalytics,
      revenue: revenueAnalytics,
      venues: venueAnalytics,
      customers: customerAnalytics,
      performance: performanceAnalytics
    });
  });
}

// Booking Analytics
async function getBookingAnalytics(propertyId: string, dateRange: any) {
  const baseQuery = { propertyId, createdAt: dateRange };

  const [totalBookings, statusBreakdown, eventTypeBreakdown, monthlyTrend] = await Promise.all([
    // Total bookings count
    EventBooking.countDocuments(baseQuery),

    // Status breakdown
    EventBooking.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]),

    // Event type breakdown
    EventBooking.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$eventType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]),

    // Monthly trend
    EventBooking.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  return {
    total: totalBookings,
    statusBreakdown: statusBreakdown.reduce((acc: any, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    eventTypeBreakdown,
    monthlyTrend,
    growthRate: calculateGrowthRate(monthlyTrend)
  };
}

// Lead Analytics
async function getLeadAnalytics(propertyId: string, dateRange: any) {
  const baseQuery = { propertyId, createdAt: dateRange };

  const [totalLeads, sourceBreakdown, conversionData, leadScoreAnalysis] = await Promise.all([
    EventLead.countDocuments(baseQuery),

    EventLead.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          averageScore: { $avg: '$leadScore' },
          conversions: { $sum: { $cond: ['$conversionData.convertedToBooking', 1, 0] } }
        }
      },
      { $sort: { count: -1 } }
    ]),

    EventLead.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalLeads: { $sum: 1 },
          conversions: { $sum: { $cond: ['$conversionData.convertedToBooking', 1, 0] } },
          totalValue: { $sum: { $ifNull: ['$conversionData.conversionValue', 0] } }
        }
      }
    ]),

    EventLead.aggregate([
      { $match: baseQuery },
      {
        $bucket: {
          groupBy: '$leadScore',
          boundaries: [0, 25, 50, 75, 100],
          default: 'other',
          output: {
            count: { $sum: 1 },
            conversions: { $sum: { $cond: ['$conversionData.convertedToBooking', 1, 0] } }
          }
        }
      }
    ])
  ]);

  const conversionRate = conversionData[0]?.totalLeads > 0 
    ? (conversionData[0].conversions / conversionData[0].totalLeads) * 100 
    : 0;

  return {
    total: totalLeads,
    conversionRate: Math.round(conversionRate * 100) / 100,
    sourceBreakdown: sourceBreakdown.map(item => ({
      ...item,
      conversionRate: item.count > 0 ? Math.round((item.conversions / item.count) * 10000) / 100 : 0
    })),
    leadScoreDistribution: leadScoreAnalysis,
    totalConversionValue: conversionData[0]?.totalValue || 0
  };
}

// Quote Analytics
async function getQuoteAnalytics(propertyId: string, dateRange: any) {
  const baseQuery = { propertyId, createdAt: dateRange };

  const [totalQuotes, statusBreakdown, conversionAnalysis] = await Promise.all([
    EventQuote.countDocuments(baseQuery),

    EventQuote.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$pricing.totalAmount' }
        }
      }
    ]),

    EventQuote.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalQuotes: { $sum: 1 },
          acceptedQuotes: { $sum: { $cond: [{ $eq: ['$status', 'accepted'] }, 1, 0] } },
          totalValue: { $sum: '$pricing.totalAmount' },
          acceptedValue: { 
            $sum: { 
              $cond: [
                { $eq: ['$status', 'accepted'] }, 
                '$pricing.totalAmount', 
                0
              ] 
            }
          }
        }
      }
    ])
  ]);

  const conversion = conversionAnalysis[0] || {};
  const quoteConversionRate = conversion.totalQuotes > 0 
    ? (conversion.acceptedQuotes / conversion.totalQuotes) * 100 
    : 0;

  return {
    total: totalQuotes,
    conversionRate: Math.round(quoteConversionRate * 100) / 100,
    statusBreakdown,
    totalValue: conversion.totalValue || 0,
    acceptedValue: conversion.acceptedValue || 0,
    averageQuoteValue: conversion.totalQuotes > 0 ? conversion.totalValue / conversion.totalQuotes : 0
  };
}

// Feedback Analytics
async function getFeedbackAnalytics(propertyId: string, dateRange: any) {
  const baseQuery = { propertyId, createdAt: dateRange };

  const [feedbackSummary, npsAnalysis, satisfactionTrends] = await Promise.all([
    EventFeedback.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalFeedbacks: { $sum: 1 },
          averageSatisfaction: { $avg: '$overallRatings.overallSatisfaction' },
          averageNPS: { $avg: '$npsData.score' },
          completedFeedbacks: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]),

    EventFeedback.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$npsData.category',
          count: { $sum: 1 }
        }
      }
    ]),

    EventFeedback.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          averageSatisfaction: { $avg: '$overallRatings.overallSatisfaction' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  const summary = feedbackSummary[0] || {};
  const nps = npsAnalysis.reduce((acc: any, item) => {
    acc[item._id || 'unknown'] = item.count;
    return acc;
  }, {});

  const npsScore = summary.totalFeedbacks > 0 
    ? Math.round(((nps.promoter || 0) - (nps.detractor || 0)) / summary.totalFeedbacks * 100)
    : 0;

  return {
    totalFeedbacks: summary.totalFeedbacks || 0,
    completionRate: summary.totalFeedbacks > 0 
      ? Math.round((summary.completedFeedbacks / summary.totalFeedbacks) * 100)
      : 0,
    averageSatisfaction: Math.round((summary.averageSatisfaction || 0) * 10) / 10,
    npsScore,
    npsBreakdown: nps,
    satisfactionTrend: satisfactionTrends
  };
}

// Revenue Analytics
async function getRevenueAnalytics(propertyId: string, dateRange: any) {
  const baseQuery = { propertyId, createdAt: dateRange, status: { $in: ['confirmed', 'in-progress', 'completed'] } };

  const [revenueData, revenueBreakdown, monthlyRevenue] = await Promise.all([
    EventBooking.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalBookings: { $sum: 1 },
          averageBookingValue: { $avg: '$totalAmount' },
          totalAdvanceReceived: { $sum: '$advancePayment' },
          totalBalance: { $sum: '$balanceAmount' }
        }
      }
    ]),

    EventBooking.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$eventType',
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
          averageValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { revenue: -1 } }
    ]),

    EventBooking.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            year: { $year: '$eventDate' },
            month: { $month: '$eventDate' }
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  const revenue = revenueData[0] || {};

  return {
    totalRevenue: revenue.totalRevenue || 0,
    averageBookingValue: Math.round(revenue.averageBookingValue || 0),
    totalAdvanceReceived: revenue.totalAdvanceReceived || 0,
    totalBalance: revenue.totalBalance || 0,
    collectionRate: revenue.totalRevenue > 0 
      ? Math.round((revenue.totalAdvanceReceived / revenue.totalRevenue) * 100)
      : 0,
    revenueByEventType: revenueBreakdown,
    monthlyTrend: monthlyRevenue,
    growthRate: calculateGrowthRate(monthlyRevenue, 'revenue')
  };
}

// Venue Analytics
async function getVenueAnalytics(propertyId: string, dateRange: any) {
  const baseQuery = { propertyId, createdAt: dateRange };

  const [venueUtilization, venueRevenue] = await Promise.all([
    EventBooking.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$venueId',
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
          averageBookingValue: { $avg: '$totalAmount' }
        }
      },
      { $sort: { bookings: -1 } }
    ]),

    EventBooking.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: {
            venueId: '$venueId',
            month: { $month: '$eventDate' }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      }
    ])
  ]);

  return {
    utilizationByVenue: venueUtilization,
    monthlyUtilization: venueRevenue,
    mostPopularVenue: venueUtilization[0] || null,
    totalVenuesUsed: venueUtilization.length
  };
}

// Customer Analytics
async function getCustomerAnalytics(propertyId: string, dateRange: any) {
  const baseQuery = { propertyId, createdAt: dateRange };

  const [customerSegmentation, repeatCustomers, customerValue] = await Promise.all([
    EventBooking.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$eventType',
          uniqueCustomers: { $addToSet: '$organizer.email' },
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' }
        }
      },
      {
        $addFields: {
          customerCount: { $size: '$uniqueCustomers' }
        }
      }
    ]),

    EventBooking.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$organizer.email',
          bookings: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          lastBooking: { $max: '$eventDate' }
        }
      },
      {
        $match: { bookings: { $gt: 1 } }
      }
    ]),

    EventBooking.aggregate([
      { $match: baseQuery },
      {
        $bucket: {
          groupBy: '$totalAmount',
          boundaries: [0, 50000, 100000, 200000, 500000, 1000000],
          default: 'high_value',
          output: {
            count: { $sum: 1 },
            totalRevenue: { $sum: '$totalAmount' }
          }
        }
      }
    ])
  ]);

  return {
    segmentationByEventType: customerSegmentation,
    repeatCustomers: {
      count: repeatCustomers.length,
      details: repeatCustomers.slice(0, 10) // Top 10 repeat customers
    },
    valueDistribution: customerValue,
    totalUniqueCustomers: customerSegmentation.reduce((sum, seg) => sum + seg.customerCount, 0)
  };
}

// Performance Analytics
async function getPerformanceAnalytics(propertyId: string, dateRange: any) {
  const baseQuery = { propertyId, createdAt: dateRange };

  // This is a simplified version - in practice, you'd want more detailed performance metrics
  const [bookingEfficiency, customerAcquisitionCost, lifetime] = await Promise.all([
    EventBooking.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: null,
          averageLeadTime: {
            $avg: {
              $divide: [
                { $subtract: ['$eventDate', '$createdAt'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          },
          onTimeDelivery: {
            $avg: {
              $cond: [
                { $lte: ['$eventDate', new Date()] },
                1, 0
              ]
            }
          }
        }
      }
    ]),

    // Placeholder for CAC calculation
    Promise.resolve({ cac: 5000, trend: 'improving' }),

    EventBooking.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$organizer.email',
          totalValue: { $sum: '$totalAmount' },
          bookingCount: { $sum: 1 },
          firstBooking: { $min: '$createdAt' },
          lastBooking: { $max: '$createdAt' }
        }
      },
      {
        $group: {
          _id: null,
          averageLifetimeValue: { $avg: '$totalValue' },
          averageBookingsPerCustomer: { $avg: '$bookingCount' }
        }
      }
    ])
  ]);

  const efficiency = bookingEfficiency[0] || {};
  const lifetimeValue = lifetime[0] || {};

  return {
    averageLeadTime: Math.round(efficiency.averageLeadTime || 0),
    onTimeDeliveryRate: Math.round((efficiency.onTimeDelivery || 0) * 100),
    customerAcquisitionCost: customerAcquisitionCost.cac,
    averageLifetimeValue: Math.round(lifetimeValue.averageLifetimeValue || 0),
    averageBookingsPerCustomer: Math.round((lifetimeValue.averageBookingsPerCustomer || 0) * 10) / 10
  };
}

// Helper function to calculate growth rate
function calculateGrowthRate(monthlyData: any[], field: string = 'count') {
  if (monthlyData.length < 2) return 0;
  
  const latest = monthlyData[monthlyData.length - 1];
  const previous = monthlyData[monthlyData.length - 2];
  
  if (!previous || !latest || previous[field] === 0) return 0;
  
  return Math.round(((latest[field] - previous[field]) / previous[field]) * 100);
}