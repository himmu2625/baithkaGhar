import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { connectMongo } from '@/lib/db/mongodb';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import Event from '@/models/Event';
import { startOfDay, endOfDay, subDays, format, eachDayOfInterval } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectMongo();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : subDays(new Date(), 30);
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();
    const propertyIds = searchParams.get('propertyIds')?.split(',').filter(Boolean) || [];
    const eventIds = searchParams.get('eventIds')?.split(',').filter(Boolean) || [];

    // Build filter query
    const dateFilter = {
      createdAt: {
        $gte: startOfDay(startDate),
        $lte: endOfDay(endDate)
      }
    };

    const propertyFilter = propertyIds.length > 0 ? { property: { $in: propertyIds } } : {};

    // Aggregate revenue data
    const revenueData = await Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          ...propertyFilter,
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          revenue: { $sum: "$totalAmount" },
          bookings: { $sum: 1 },
          avgPrice: { $avg: "$totalAmount" }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    // Generate daily revenue with missing dates filled
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const dailyRevenue = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const existing = revenueData.find(d => d._id.date === dayStr);
      return {
        date: dayStr,
        revenue: existing?.revenue || 0,
        bookings: existing?.bookings || 0,
        avgPrice: existing?.avgPrice || 0
      };
    });

    // Calculate monthly revenue growth
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: subDays(new Date(), 180) },
          ...propertyFilter,
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          revenue: { $sum: "$totalAmount" },
          bookings: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 }
      }
    ]);

    // Calculate growth rates
    const monthlyGrowth = monthlyRevenue.map((month, index) => {
      const prevMonth = monthlyRevenue[index - 1];
      const growth = prevMonth ? ((month.revenue - prevMonth.revenue) / prevMonth.revenue) * 100 : 0;
      
      return {
        month: format(new Date(month._id.year, month._id.month - 1), 'MMM'),
        revenue: month.revenue,
        growth: Math.round(growth * 10) / 10,
        bookings: month.bookings
      };
    });

    // Aggregate occupancy data
    const properties = await Property.find(propertyFilter).select('_id totalHotelRooms name location');
    const totalRooms = properties.reduce((sum, prop) => sum + parseInt(prop.totalHotelRooms || '1'), 0);

    const occupancyData = await Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          ...propertyFilter,
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$checkIn" } }
          },
          bookedRooms: { $sum: "$roomsCount" }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    // Generate daily occupancy with missing dates filled
    const dailyOccupancy = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const existing = occupancyData.find(d => d._id.date === dayStr);
      const booked = existing?.bookedRooms || 0;
      const available = totalRooms;
      const rate = available > 0 ? (booked / available) * 100 : 0;
      
      return {
        date: dayStr,
        rate: Math.round(rate * 10) / 10,
        available,
        booked
      };
    });

    // Calculate average occupancy and trend
    const avgOccupancy = dailyOccupancy.reduce((sum, day) => sum + day.rate, 0) / dailyOccupancy.length;
    const recentOccupancy = dailyOccupancy.slice(-7).reduce((sum, day) => sum + day.rate, 0) / 7;
    const earlierOccupancy = dailyOccupancy.slice(-14, -7).reduce((sum, day) => sum + day.rate, 0) / 7;
    const occupancyTrend = earlierOccupancy > 0 ? ((recentOccupancy - earlierOccupancy) / earlierOccupancy) * 100 : 0;

    // Aggregate pricing trends
    const pricingTrends = await Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          ...propertyFilter,
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          avgPrice: { $avg: "$totalAmount" },
          minPrice: { $min: "$totalAmount" },
          maxPrice: { $max: "$totalAmount" }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    // Generate pricing trends with missing dates filled
    const dailyPricing = days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const existing = pricingTrends.find(d => d._id.date === dayStr);
      return {
        date: dayStr,
        avgPrice: Math.round(existing?.avgPrice || 0),
        minPrice: Math.round(existing?.minPrice || 0),
        maxPrice: Math.round(existing?.maxPrice || 0)
      };
    });

    // Price distribution analysis
    const priceDistribution = await Booking.aggregate([
      {
        $match: {
          ...dateFilter,
          ...propertyFilter,
          status: { $in: ['confirmed', 'completed'] }
        }
      },
      {
        $bucket: {
          groupBy: "$totalAmount",
          boundaries: [0, 2000, 4000, 6000, 8000, 10000, 20000],
          default: "10000+",
          output: {
            count: { $sum: 1 },
            revenue: { $sum: "$totalAmount" }
          }
        }
      }
    ]);

    const formattedPriceDistribution = priceDistribution.map((bucket, index) => {
      const ranges = ['₹0-2K', '₹2K-4K', '₹4K-6K', '₹6K-8K', '₹8K-10K', '₹10K+'];
      return {
        range: ranges[index] || '₹10K+',
        count: bucket.count,
        revenue: bucket.revenue
      };
    });

    // Top price changes analysis
    const propertyPriceChanges = await Property.aggregate([
      {
        $match: propertyIds.length > 0 ? { _id: { $in: propertyIds } } : {}
      },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'property',
          as: 'recentBookings',
          pipeline: [
            {
              $match: {
                createdAt: { $gte: subDays(new Date(), 7) },
                status: { $in: ['confirmed', 'completed'] }
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'property',
          as: 'olderBookings',
          pipeline: [
            {
              $match: {
                createdAt: { 
                  $gte: subDays(new Date(), 14),
                  $lt: subDays(new Date(), 7)
                },
                status: { $in: ['confirmed', 'completed'] }
              }
            }
          ]
        }
      },
      {
        $addFields: {
          recentAvgPrice: { $avg: "$recentBookings.totalAmount" },
          olderAvgPrice: { $avg: "$olderBookings.totalAmount" }
        }
      },
      {
        $addFields: {
          priceChange: {
            $cond: {
              if: { $gt: ["$olderAvgPrice", 0] },
              then: {
                $multiply: [
                  { $divide: [
                    { $subtract: ["$recentAvgPrice", "$olderAvgPrice"] },
                    "$olderAvgPrice"
                  ]},
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $match: {
          priceChange: { $ne: 0 }
        }
      },
      {
        $sort: { priceChange: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const topPriceChanges = propertyPriceChanges.map(property => ({
      id: property._id,
      name: property.name,
      location: property.location,
      oldPrice: Math.round(property.olderAvgPrice || 0),
      newPrice: Math.round(property.recentAvgPrice || 0),
      change: Math.round(property.priceChange * 10) / 10,
      impact: `${property.priceChange > 0 ? '+' : ''}₹${Math.round(Math.abs(property.recentAvgPrice - property.olderAvgPrice) * 30 / 1000)}K revenue`
    }));

    // Top performers analysis
    const topPerformers = await Property.aggregate([
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'property',
          as: 'bookings',
          pipeline: [
            {
              $match: {
                ...dateFilter,
                status: { $in: ['confirmed', 'completed'] }
              }
            }
          ]
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'property',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          revenue: { $sum: "$bookings.totalAmount" },
          bookingCount: { $size: "$bookings" },
          avgRating: { $avg: "$reviews.rating" },
          occupancyRate: {
            $multiply: [
              { $divide: [
                { $sum: "$bookings.roomsCount" },
                { $multiply: [{ $toInt: "$totalHotelRooms" }, 30] }
              ]},
              100
            ]
          }
        }
      },
      {
        $match: {
          revenue: { $gt: 0 }
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 10
      }
    ]);

    const formattedTopPerformers = topPerformers.map(property => ({
      id: property._id,
      name: property.name,
      location: property.location,
      revenue: property.revenue,
      occupancy: Math.round(Math.min(property.occupancyRate, 100)),
      growth: Math.random() * 30 + 10, // Mock growth data
      rating: Math.round((property.avgRating || 4.0) * 10) / 10
    }));

    // Event impact analysis
    const events = await Event.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });

    const eventImpacts = await Promise.all(
      events.map(async (event) => {
        const eventDate = new Date(event.date);
        const eventStart = startOfDay(eventDate);
        const eventEnd = endOfDay(eventDate);
        
        const eventBookings = await Booking.find({
          checkIn: { $gte: eventStart, $lte: eventEnd },
          ...propertyFilter,
          status: { $in: ['confirmed', 'completed'] }
        });

        const eventRevenue = eventBookings.reduce((sum, booking) => sum + booking.totalAmount, 0);
        const eventBookingCount = eventBookings.length;

        // Calculate baseline (average of nearby dates)
        const baselineStart = subDays(eventDate, 7);
        const baselineEnd = subDays(eventDate, 1);
        
        const baselineBookings = await Booking.find({
          checkIn: { $gte: baselineStart, $lte: baselineEnd },
          ...propertyFilter,
          status: { $in: ['confirmed', 'completed'] }
        });

        const baselineAvgRevenue = baselineBookings.length > 0 
          ? baselineBookings.reduce((sum, booking) => sum + booking.totalAmount, 0) / 7
          : 0;

        const impact = baselineAvgRevenue > 0 
          ? ((eventRevenue - baselineAvgRevenue) / baselineAvgRevenue) * 100
          : 0;

        return {
          id: event._id,
          name: event.name,
          date: format(eventDate, 'yyyy-MM-dd'),
          impact: Math.round(impact * 10) / 10,
          bookings: eventBookingCount,
          revenue: eventRevenue
        };
      })
    );

    // Calculate total metrics
    const totalRevenue = dailyRevenue.reduce((sum, day) => sum + day.revenue, 0);
    const totalRevenueGrowth = monthlyGrowth.length > 1 
      ? monthlyGrowth[monthlyGrowth.length - 1].growth 
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          daily: dailyRevenue,
          monthly: monthlyGrowth,
          total: totalRevenue,
          growth: totalRevenueGrowth
        },
        occupancy: {
          daily: dailyOccupancy,
          average: Math.round(avgOccupancy * 10) / 10,
          trend: Math.round(occupancyTrend * 10) / 10
        },
        pricing: {
          trends: dailyPricing,
          distribution: formattedPriceDistribution
        },
        topMovers: {
          priceChanges: topPriceChanges,
          performance: formattedTopPerformers
        },
        events: eventImpacts
      }
    });

  } catch (error) {
    console.error('Analytics dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 