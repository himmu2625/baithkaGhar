import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { connectMongo } from '@/lib/db/mongodb';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import { startOfDay, endOfDay, eachDayOfInterval, format, parseISO, subDays, addDays } from 'date-fns';

interface HeatmapDataPoint {
  date: string;
  occupancyRate: number;
  revenue: number;
  bookingsCount: number;
  averageRate: number;
  totalRooms: number;
  occupiedRooms: number;
}

interface HeatmapResponse {
  success: boolean;
  data: HeatmapDataPoint[];
  summary: {
    totalRevenue: number;
    averageOccupancy: number;
    totalBookings: number;
    averageRate: number;
    bestDay: {
      date: string;
      revenue: number;
      occupancy: number;
    };
    worstDay: {
      date: string;
      revenue: number;
      occupancy: number;
    };
  };
  dateRange: {
    start: string;
    end: string;
  };
}

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    
    // Parse query parameters
    const propertyId = searchParams.get('propertyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const granularity = searchParams.get('granularity') || 'daily'; // daily, weekly, monthly
    
    // Default to last 90 days if no date range provided
    const defaultEndDate = new Date();
    const defaultStartDate = subDays(defaultEndDate, 90);
    
    const start = startDate ? parseISO(startDate) : defaultStartDate;
    const end = endDate ? parseISO(endDate) : defaultEndDate;

    // Validate date range
    if (start > end) {
      return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
    }

    // Build property filter
    const propertyFilter: any = {};
    if (propertyId) {
      propertyFilter.propertyId = propertyId;
    }

    // Generate all dates in the range
    const allDates = eachDayOfInterval({ start, end });
    
    // Get property data for room count calculation
    const properties = propertyId 
      ? await Property.findById(propertyId).select('totalHotelRooms maxGuests').lean()
      : await Property.find({}).select('_id totalHotelRooms maxGuests').lean();

    // Calculate total available rooms
    const totalRoomsAvailable = propertyId 
      ? (properties && (properties as any).totalHotelRooms ? parseInt((properties as any).totalHotelRooms) || 1 : 1)
      : Array.isArray(properties)
        ? (properties as any[]).reduce((sum, prop) => sum + (parseInt(prop.totalHotelRooms) || 1), 0)
        : 0;

    // Aggregate booking data by date
    const bookingAggregation = await Booking.aggregate([
      {
        $match: {
          ...propertyFilter,
          status: { $in: ['confirmed', 'completed'] },
          $or: [
            {
              checkInDate: {
                $gte: startOfDay(start),
                $lte: endOfDay(end)
              }
            },
            {
              checkOutDate: {
                $gte: startOfDay(start),
                $lte: endOfDay(end)
              }
            },
            {
              checkInDate: { $lte: startOfDay(start) },
              checkOutDate: { $gte: endOfDay(end) }
            }
          ]
        }
      },
      {
        $addFields: {
          // Create array of dates for each booking
          dateRange: {
            $map: {
              input: {
                $range: [
                  0,
                  {
                    $add: [
                      {
                        $divide: [
                          { $subtract: ['$checkOutDate', '$checkInDate'] },
                          1000 * 60 * 60 * 24
                        ]
                      },
                      1
                    ]
                  }
                ]
              },
              in: {
                $dateAdd: {
                  startDate: '$checkInDate',
                  unit: 'day',
                  amount: '$$this'
                }
              }
            }
          }
        }
      },
      {
        $unwind: '$dateRange'
      },
      {
        $match: {
          dateRange: {
            $gte: startOfDay(start),
            $lte: endOfDay(end)
          }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$dateRange'
              }
            }
          },
          revenue: { $sum: '$totalPrice' },
          bookingsCount: { $sum: 1 },
          totalGuests: { $sum: '$guests' },
          totalRooms: { $sum: '$rooms' },
          rates: { $push: '$pricePerNight' }
        }
      },
      {
        $addFields: {
          averageRate: { $avg: '$rates' }
        }
      },
      {
        $sort: { '_id.date': 1 }
      }
    ]);

    // Create a map for quick lookup
    const bookingDataMap = new Map();
    bookingAggregation.forEach(item => {
      bookingDataMap.set(item._id.date, {
        revenue: item.revenue,
        bookingsCount: item.bookingsCount,
        occupiedRooms: item.totalRooms,
        averageRate: item.averageRate || 0,
        totalGuests: item.totalGuests
      });
    });

    // Generate heatmap data for all dates
    const heatmapData: HeatmapDataPoint[] = allDates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const bookingData = bookingDataMap.get(dateStr) || {
        revenue: 0,
        bookingsCount: 0,
        occupiedRooms: 0,
        averageRate: 0,
        totalGuests: 0
      };

      const occupancyRate = totalRoomsAvailable > 0 
        ? (bookingData.occupiedRooms / totalRoomsAvailable) * 100 
        : 0;

      return {
        date: dateStr,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        revenue: bookingData.revenue,
        bookingsCount: bookingData.bookingsCount,
        averageRate: Math.round(bookingData.averageRate),
        totalRooms: totalRoomsAvailable,
        occupiedRooms: bookingData.occupiedRooms
      };
    });

    // Calculate summary statistics
    const totalRevenue = heatmapData.reduce((sum, day) => sum + day.revenue, 0);
    const averageOccupancy = heatmapData.length > 0 
      ? heatmapData.reduce((sum, day) => sum + day.occupancyRate, 0) / heatmapData.length 
      : 0;
    const totalBookings = heatmapData.reduce((sum, day) => sum + day.bookingsCount, 0);
    const averageRate = heatmapData.length > 0
      ? heatmapData.filter(day => day.averageRate > 0).reduce((sum, day) => sum + day.averageRate, 0) / 
        Math.max(1, heatmapData.filter(day => day.averageRate > 0).length)
      : 0;

    // Find best and worst performing days
    const daysWithData = heatmapData.filter(day => day.revenue > 0 || day.occupancyRate > 0);
    
    const bestDay = daysWithData.reduce((best, day) => 
      (day.revenue + day.occupancyRate) > (best.revenue + best.occupancyRate) ? day : best,
      daysWithData[0] || heatmapData[0]
    );

    const worstDay = daysWithData.reduce((worst, day) => 
      (day.revenue + day.occupancyRate) < (worst.revenue + worst.occupancyRate) ? day : worst,
      daysWithData[0] || heatmapData[0]
    );

    const response: HeatmapResponse = {
      success: true,
      data: heatmapData,
      summary: {
        totalRevenue: Math.round(totalRevenue),
        averageOccupancy: Math.round(averageOccupancy * 100) / 100,
        totalBookings,
        averageRate: Math.round(averageRate),
        bestDay: {
          date: bestDay?.date || '',
          revenue: bestDay?.revenue || 0,
          occupancy: bestDay?.occupancyRate || 0
        },
        worstDay: {
          date: worstDay?.date || '',
          revenue: worstDay?.revenue || 0,
          occupancy: worstDay?.occupancyRate || 0
        }
      },
      dateRange: {
        start: format(start, 'yyyy-MM-dd'),
        end: format(end, 'yyyy-MM-dd')
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching heatmap analytics:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch heatmap analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 