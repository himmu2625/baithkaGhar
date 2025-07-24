import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/dbConnect';
import Booking from '@/models/Booking';
import Property from '@/models/Property';
import { getSession } from '@/lib/get-session';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const timeRange = parseInt(searchParams.get('timeRange') || '30');
    const propertyId = searchParams.get('propertyId');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - timeRange);

    // Build query
    const query: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: ['confirmed', 'completed'] }
    };

    if (propertyId && propertyId !== 'all') {
      query.propertyId = propertyId;
    }

    // Aggregate booking data
    const bookings = await Booking.find(query)
      .populate('propertyId', 'title dynamicPricing')
      .lean();

    // Calculate metrics
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    const bookingsCount = bookings.length;
    const averagePrice = bookingsCount > 0 ? totalRevenue / bookingsCount : 0;

    // Calculate price change (simplified - compare with previous period)
    const previousStartDate = new Date(startDate);
    previousStartDate.setDate(previousStartDate.getDate() - timeRange);
    const previousEndDate = new Date(startDate);
    
    const previousBookings = await Booking.find({
      createdAt: { $gte: previousStartDate, $lte: previousEndDate },
      status: { $in: ['confirmed', 'completed'] }
    }).lean();

    const previousRevenue = previousBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
    const priceChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Calculate occupancy rate (simplified)
    const totalDays = bookings.reduce((sum, booking) => {
      const checkIn = new Date(booking.dateFrom);
      const checkOut = new Date(booking.dateTo);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      return sum + nights;
    }, 0);

    const totalPropertyDays = timeRange * (propertyId && propertyId !== 'all' ? 1 : 10); // Assume 10 properties if not filtered
    const occupancyRate = totalPropertyDays > 0 ? (totalDays / totalPropertyDays) * 100 : 0;

    // Get properties with dynamic pricing
    const properties = await Property.find({}).select('title dynamicPricing').lean();
    const dynamicPricingEnabled = properties.filter(p => p.dynamicPricing?.enabled).length;
    const dynamicPricingPercentage = properties.length > 0 ? (dynamicPricingEnabled / properties.length) * 100 : 0;

    // Generate revenue by month data
    const revenueByMonth: any[] = [];
    const months: string[] = [];
    for (let i = timeRange - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      
      if (!months.includes(monthKey)) {
        months.push(monthKey);
        const monthBookings = bookings.filter(booking => 
          new Date(booking.createdAt).toISOString().slice(0, 7) === monthKey
        );
        
        const monthRevenue = monthBookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0);
        const monthAveragePrice = monthBookings.length > 0 ? monthRevenue / monthBookings.length : 0;
        
        revenueByMonth.push({
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthRevenue,
          bookings: monthBookings.length,
          averagePrice: monthAveragePrice
        });
      }
    }

    // Top performing properties
    const propertyRevenue = new Map();
    bookings.forEach(booking => {
      const propertyName = booking.propertyId?.title || 'Unknown Property';
      const current = propertyRevenue.get(propertyName) || { revenue: 0, bookings: 0, totalPrice: 0 };
      propertyRevenue.set(propertyName, {
        propertyId: booking.propertyId?._id || 'unknown',
        propertyName,
        revenue: current.revenue + (booking.totalPrice || 0),
        bookings: current.bookings + 1,
        totalPrice: current.totalPrice + (booking.totalPrice || 0)
      });
    });

    const topPerformingProperties = Array.from(propertyRevenue.values())
      .map(property => ({
        ...property,
        averagePrice: property.bookings > 0 ? property.totalPrice / property.bookings : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Pricing factors usage (simplified)
    const pricingFactorsUsage = [
      { factor: 'Seasonal Multiplier', usage: 75, impact: 15 },
      { factor: 'Weekend Premium', usage: 90, impact: 25 },
      { factor: 'Advance Discount', usage: 60, impact: 10 },
      { factor: 'Demand-Based', usage: 45, impact: 20 },
      { factor: 'Holiday Premium', usage: 80, impact: 30 }
    ];

    const analytics = {
      totalRevenue,
      averagePrice,
      priceChange,
      bookingsCount,
      occupancyRate,
      dynamicPricingEnabled: dynamicPricingPercentage,
      revenueByMonth,
      topPerformingProperties,
      pricingFactorsUsage
    };

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Pricing analytics error:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
} 