import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/db/mongodb';
import TravelAgent from '@/models/TravelAgent';
import Booking from '@/models/Booking';
import { getSession } from '@/lib/get-session';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user || !['admin', 'super_admin'].includes((session.user as any).role || '')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const companyType = searchParams.get('companyType');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status && status !== 'all') query.status = status;
    if (companyType && companyType !== 'all') query.companyType = companyType;

    // Get travel agents with pagination
    const travelAgents = await TravelAgent.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const total = await TravelAgent.countDocuments(query);

    // Format travel agents for frontend
    const formattedAgents = travelAgents.map(agent => ({
      id: agent._id.toString(),
      name: agent.name,
      email: agent.email,
      phone: agent.phone,
      companyName: agent.companyName,
      companyType: agent.companyType,
      status: agent.status,
      verificationStatus: agent.verificationStatus,
      totalEarnings: agent.totalEarnings,
      walletBalance: agent.walletBalance,
      totalBookings: agent.totalBookings,
      totalRevenue: agent.totalRevenue,
      totalClients: agent.totalClients,
      averageBookingValue: agent.averageBookingValue,
      commissionDisplay: agent.commissionDisplay,
      joinedAt: agent.joinedAt,
      lastActiveAt: agent.lastActiveAt,
      address: agent.address,
      businessDetails: agent.businessDetails,
      commissionStructure: agent.commissionStructure,
      preferences: agent.preferences,
      notes: agent.notes,
      tags: agent.tags
    }));

    return NextResponse.json({
      success: true,
      travelAgents: formattedAgents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Travel agents fetch error:', error);
    return NextResponse.json(
      { success: false, message: `Failed to fetch travel agents: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user || !['admin', 'super_admin'].includes((session.user as any).role || '')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectMongo();
    
    const body = await req.json();
    const { action, travelAgentId, ...data } = body;

    if (!action || !travelAgentId) {
      return NextResponse.json(
        { success: false, message: 'Action and travel agent ID are required' },
        { status: 400 }
      );
    }

    const travelAgent = await TravelAgent.findById(travelAgentId);
    if (!travelAgent) {
      return NextResponse.json(
        { success: false, message: 'Travel agent not found' },
        { status: 404 }
      );
    }

    switch (action) {
      case 'update':
        // Update travel agent details
        Object.assign(travelAgent, data);
        await travelAgent.save();
        
        return NextResponse.json({
          success: true,
          message: 'Travel agent updated successfully'
        });

      case 'updateStatus':
        travelAgent.status = data.status;
        if (data.notes) travelAgent.notes = data.notes;
        await travelAgent.save();
        
        return NextResponse.json({
          success: true,
          message: 'Travel agent status updated successfully'
        });

      case 'updateCommission':
        travelAgent.commissionStructure = {
          ...travelAgent.commissionStructure,
          ...data.commissionStructure
        };
        await travelAgent.save();
        
        return NextResponse.json({
          success: true,
          message: 'Commission structure updated successfully'
        });

      case 'addFunds':
        travelAgent.walletBalance += data.amount;
        travelAgent.totalEarnings += data.amount;
        await travelAgent.save();
        
        return NextResponse.json({
          success: true,
          message: 'Funds added successfully'
        });

      case 'withdrawFunds':
        if (travelAgent.walletBalance < data.amount) {
          return NextResponse.json(
            { success: false, message: 'Insufficient wallet balance' },
            { status: 400 }
          );
        }
        
        travelAgent.walletBalance -= data.amount;
        await travelAgent.save();
        
        return NextResponse.json({
          success: true,
          message: 'Funds withdrawn successfully'
        });

      case 'getAnalytics':
        // Get booking analytics for this travel agent
        const bookings = await Booking.find({ travelAgentId })
          .select('totalPrice dateFrom dateTo status')
          .lean();

        const analytics = {
          totalBookings: bookings.length,
          totalRevenue: bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0),
          averageBookingValue: bookings.length > 0 
            ? bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0) / bookings.length 
            : 0,
          recentBookings: bookings.slice(0, 10),
          monthlyRevenue: {} as Record<string, number>
        };

        // Calculate monthly revenue
        bookings.forEach(booking => {
          const month = new Date(booking.dateFrom).toISOString().slice(0, 7);
          analytics.monthlyRevenue[month] = (analytics.monthlyRevenue[month] || 0) + (booking.totalPrice || 0);
        });

        return NextResponse.json({
          success: true,
          analytics
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error: any) {
    console.error('Travel agent action error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process action' },
      { status: 500 }
    );
  }
} 