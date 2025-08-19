import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { webSocketManager } from '@/lib/websocket-server';
import { RBAC, ROLES, PERMISSIONS } from '@/lib/rbac';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to trigger real-time updates
    const userRoleKey = session.user.role as keyof typeof ROLES;
    const userRole = ROLES[userRoleKey];
    const hasPermission = RBAC.hasPermission(userRole, PERMISSIONS.OS_DASHBOARD_ACCESS);

    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'Access denied. Real-time update permission required.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { 
      type, 
      data, 
      room, 
      userId, 
      role, 
      affectedUsers 
    } = body;

    if (!type || !data) {
      return NextResponse.json({ 
        error: 'Missing required fields: type and data' 
      }, { status: 400 });
    }

    // Validate update type
    const validTypes = ['booking_update', 'property_update', 'alert_update', 'metric_update', 'user_activity'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ 
        error: `Invalid type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Create the update
    const update = {
      type,
      data,
      timestamp: new Date().toISOString(),
      affectedUsers: affectedUsers || []
    };

    // Send the update through WebSocket manager
    webSocketManager.sendDashboardUpdate(update);

    // Log the update
    console.log(`Real-time update triggered:`, {
      type,
      triggeredBy: session.user.id,
      timestamp: update.timestamp,
      room,
      userId,
      role
    });

    return NextResponse.json({
      success: true,
      message: 'Real-time update triggered successfully',
      update: {
        type,
        timestamp: update.timestamp,
        affectedUsers: update.affectedUsers.length
      }
    });

  } catch (error) {
    console.error('Error triggering real-time update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const userRoleKey = session.user.role as keyof typeof ROLES;
    const userRole = ROLES[userRoleKey];
    const hasAdminPermission = RBAC.hasPermission(userRole, PERMISSIONS.ADMIN_PANEL_ACCESS);

    if (!hasAdminPermission) {
      return NextResponse.json({ 
        error: 'Access denied. Admin permission required.' 
      }, { status: 403 });
    }

    // Get WebSocket statistics
    const stats = webSocketManager.getStats();
    const connectedUsers = webSocketManager.getConnectedUsers();

    return NextResponse.json({
      success: true,
      stats,
      connectedUsers: connectedUsers.map(user => ({
        userId: user.userId,
        userRole: user.userRole,
        connectedAt: user.connectedAt,
        lastActivity: user.lastActivity,
        rooms: user.rooms
      }))
    });

  } catch (error) {
    console.error('Error getting real-time stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 