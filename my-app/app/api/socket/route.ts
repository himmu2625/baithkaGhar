import { NextRequest, NextResponse } from 'next/server';
import { webSocketManager } from '@/lib/websocket-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    // This endpoint is for Socket.IO handshake
    // The actual WebSocket connection will be handled by Socket.IO
    return NextResponse.json({ 
      status: 'WebSocket endpoint ready',
      message: 'Use Socket.IO client to connect'
    });
  } catch (error) {
    console.error('WebSocket route error:', error);
    return NextResponse.json(
      { error: 'WebSocket connection failed' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'broadcast':
        if (data.room) {
          webSocketManager.broadcastToRoom(data.event, data.message, data.room);
        } else if (data.userId) {
          webSocketManager.broadcastToUser(data.event, data.message, data.userId);
        } else if (data.role) {
          webSocketManager.broadcastToRole(data.event, data.message, data.role);
        } else {
          webSocketManager.broadcastToAll(data.event, data.message);
        }
        break;

      case 'dashboard_update':
        webSocketManager.sendDashboardUpdate(data);
        break;

      case 'get_stats':
        const stats = webSocketManager.getStats();
        return NextResponse.json({ stats });

      case 'get_connected_users':
        const users = webSocketManager.getConnectedUsers();
        return NextResponse.json({ users });

      case 'room_status_update':
        webSocketManager.broadcastToRoom('room:status:updated', data, `room:${data.roomId}`);
        webSocketManager.broadcastToAll('room:status:updated', data);
        break;

      case 'housekeeping_task_update':
        if (data.roomId) {
          webSocketManager.broadcastToRoom('housekeeping:task:updated', data, `room:${data.roomId}`);
        }
        webSocketManager.broadcastToAll('housekeeping:task:updated', data);
        break;

      case 'maintenance_alert':
        webSocketManager.broadcastToRole('maintenance:alert', data, 'maintenance');
        if (data.roomId) {
          webSocketManager.broadcastToRoom('maintenance:alert', data, `room:${data.roomId}`);
        }
        break;

      case 'inventory_update':
        if (data.roomId) {
          webSocketManager.broadcastToRoom('inventory:updated', data, `room:${data.roomId}`);
        }
        webSocketManager.broadcastToAll('inventory:updated', data);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('WebSocket POST error:', error);
    return NextResponse.json(
      { error: 'WebSocket operation failed' },
      { status: 500 }
    );
  }
} 