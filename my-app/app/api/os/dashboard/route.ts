import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/enhanced-mongodb';
import Property from '@/models/Property';
import Booking from '@/models/Booking';
import User from '@/models/User';
import { RBAC, ROLES, PERMISSIONS } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has OS access using RBAC
    const userRoleKey = session.user.role as keyof typeof ROLES;
    const userRole = ROLES[userRoleKey];
    const hasOSAccess = RBAC.hasPermission(userRole, PERMISSIONS.OS_DASHBOARD_ACCESS);

    if (!hasOSAccess) {
      return NextResponse.json({ 
        error: 'Access denied. OS dashboard access required.',
        requiredPermission: PERMISSIONS.OS_DASHBOARD_ACCESS,
        userRole: userRole
      }, { status: 403 });
    }

    await connectToDatabase();

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // Get user's properties based on role
    let propertyIds: string[] = [];
    let canViewAllProperties = false;

    // Super admin and admin can view all properties
    if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.ADMIN) {
      canViewAllProperties = true;
    } 
    // Property owners can view their own properties
    else if (userRole === ROLES.PROPERTY_OWNER) {
      const userProperties = await Property.find({ userId: session.user.id }).select('_id').lean();
      propertyIds = userProperties.map((p: any) => p._id?.toString?.() ?? String(p._id));
    }
    // Property managers can view assigned properties (you can extend this logic)
    else if (userRole === ROLES.PROPERTY_MANAGER) {
      // For now, property managers see their own properties
      // You can extend this to show assigned properties
      const userProperties = await Property.find({ userId: session.user.id }).select('_id').lean();
      propertyIds = userProperties.map((p: any) => p._id?.toString?.() ?? String(p._id));
    }
    // Staff and other roles have limited access
    else if (userRole === ROLES.STAFF) {
      // Staff can only view basic information
      canViewAllProperties = false;
      propertyIds = [];
    }

    // Build booking query based on permissions
    const bookingQuery: any = {
      dateFrom: { $lte: endOfDay },
      dateTo: { $gte: startOfDay }
    };

    // Apply property filtering based on role
    if (!canViewAllProperties && propertyIds.length > 0) {
      bookingQuery.propertyId = { $in: propertyIds };
    }

    // Get today's bookings
    const todayBookings = await Booking.find(bookingQuery)
      .populate('propertyId', 'title address images')
      .populate('userId', 'name email')
      .lean();

    // Get properties for occupancy calculation
    const propertyQuery: any = { status: 'available' };
    if (!canViewAllProperties && propertyIds.length > 0) {
      propertyQuery._id = { $in: propertyIds };
    }

    const properties = await Property.find(propertyQuery).lean();

    // Calculate metrics
    const totalProperties = properties.length;
    const occupiedProperties = todayBookings.length;
    const occupancyRate = totalProperties > 0 ? Math.round((occupiedProperties / totalProperties) * 100) : 0;

    // Calculate revenue for today (only if user has financial permissions)
    let todayRevenue = 0;
    let revenueChange = 0;
    
    if (RBAC.hasPermission(userRole, PERMISSIONS.FINANCIAL_VIEW)) {
      todayRevenue = todayBookings.reduce((total, booking) => {
        return total + (booking.totalPrice || 0);
      }, 0);

      // Calculate revenue trend (compare with yesterday)
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
      const yesterdayEnd = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);

      const yesterdayBookings = await Booking.find({
        dateFrom: { $lte: yesterdayEnd },
        dateTo: { $gte: yesterdayStart },
        ...(propertyIds.length > 0 && { propertyId: { $in: propertyIds } })
      }).lean();

      const yesterdayRevenue = yesterdayBookings.reduce((total, booking) => {
        return total + (booking.totalPrice || 0);
      }, 0);

      revenueChange = yesterdayRevenue > 0 ? 
        Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : 0;
    }

    // Get pending check-ins (arrivals)
    const arrivals = todayBookings.filter(booking => {
      const checkInDate = new Date(booking.dateFrom);
      return checkInDate >= startOfDay && checkInDate <= endOfDay;
    });

    // Get pending check-outs (departures)
    const departures = todayBookings.filter(booking => {
      const checkOutDate = new Date(booking.dateTo);
      return checkOutDate >= startOfDay && checkOutDate <= endOfDay;
    });

    // Get recent bookings (last 7 days) - limit based on role
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentBookingsQuery: any = {
      createdAt: { $gte: sevenDaysAgo },
      ...(propertyIds.length > 0 && { propertyId: { $in: propertyIds } })
    };

    const recentBookings = await Booking.find(recentBookingsQuery)
      .populate('propertyId', 'title address')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(userRole === ROLES.STAFF ? 5 : 10) // Staff see fewer recent bookings
      .lean();

    // Get system alerts based on permissions
    const alerts = [];

    // Check for overdue check-ins (only if user has booking management permissions)
    if (RBAC.hasPermission(userRole, PERMISSIONS.BOOKING_VIEW)) {
      const overdueCheckIns = arrivals.filter(booking => {
        const checkInTime = new Date(booking.dateFrom);
        const now = new Date();
        return checkInTime < now && booking.status !== 'completed';
      });

      if (overdueCheckIns.length > 0) {
        alerts.push({
          type: 'overdue_checkin',
          message: `${overdueCheckIns.length} overdue check-in(s)`,
          severity: 'high',
          count: overdueCheckIns.length
        });
      }
    }

    // Check for low occupancy (only if user has analytics permissions)
    if (RBAC.hasPermission(userRole, PERMISSIONS.DASHBOARD_ANALYTICS)) {
      if (occupancyRate < 30) {
        alerts.push({
          type: 'low_occupancy',
          message: `Low occupancy rate: ${occupancyRate}%`,
          severity: 'medium',
          count: occupancyRate
        });
      }
    }

    // Prepare response data based on user permissions
    const responseData: any = {
      metrics: {
        totalProperties,
        occupiedProperties,
        occupancyRate,
        todayBookings: todayBookings.length,
        arrivals: arrivals.length,
        departures: departures.length
      },
      bookings: {
        today: todayBookings,
        arrivals,
        departures,
        recent: recentBookings
      },
      alerts,
      timestamp: new Date().toISOString()
    };

    // Add financial data only if user has permission
    if (RBAC.hasPermission(userRole, PERMISSIONS.FINANCIAL_VIEW)) {
      responseData.metrics.todayRevenue = todayRevenue;
      responseData.metrics.revenueChange = revenueChange;
    }

    // Add role-specific information
    responseData.userContext = {
      role: userRole,
      roleDisplayName: RBAC.getRoleDisplayName(userRole),
      canViewAllProperties,
      accessibleRoutes: RBAC.getAccessibleRoutes(userRole),
      permissions: RBAC.getRolePermissions(userRole)
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching OS dashboard data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 