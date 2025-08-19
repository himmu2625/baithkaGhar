import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { RBAC, ROLES, PERMISSIONS } from './rbac';

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
  userId?: string;
  userRole?: string;
}

export interface DashboardUpdate {
  type: 'booking_update' | 'property_update' | 'alert_update' | 'metric_update' | 'user_activity';
  data: any;
  timestamp: string;
  affectedUsers?: string[];
}

export interface UserConnection {
  userId: string;
  userRole: string;
  socketId: string;
  connectedAt: Date;
  lastActivity: Date;
  permissions: string[];
  rooms: string[];
}

class WebSocketManager {
  private io: SocketIOServer | null = null;
  private userConnections: Map<string, UserConnection> = new Map();
  private rooms: Map<string, Set<string>> = new Map();

  initialize(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 10000,
      maxHttpBufferSize: 1e6,
      allowRequest: async (req, callback) => {
        // Allow all requests for now, authentication will be handled in connection
        callback(null, true);
      }
    });

    this.setupEventHandlers();
    console.log('WebSocket server initialized');
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', async (socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle authentication
      socket.on('authenticate', async (data: { sessionToken: string }) => {
        try {
          // Verify session and get user info
          const user = await this.authenticateUser(data.sessionToken);
          if (user) {
            await this.handleUserAuthentication(socket, user);
          } else {
            socket.emit('auth_error', { message: 'Authentication failed' });
            socket.disconnect();
          }
        } catch (error) {
          console.error('Authentication error:', error);
          socket.emit('auth_error', { message: 'Authentication error' });
          socket.disconnect();
        }
      });

      // Handle room joining
      socket.on('join_room', (roomName: string) => {
        const userConnection = this.getUserConnection(socket.id);
        if (userConnection && this.canJoinRoom(userConnection, roomName)) {
          socket.join(roomName);
          this.addUserToRoom(userConnection.userId, roomName);
          socket.emit('room_joined', { room: roomName });
          console.log(`User ${userConnection.userId} joined room: ${roomName}`);
        } else {
          socket.emit('room_error', { message: 'Cannot join room', room: roomName });
        }
      });

      // Handle room leaving
      socket.on('leave_room', (roomName: string) => {
        const userConnection = this.getUserConnection(socket.id);
        if (userConnection) {
          socket.leave(roomName);
          this.removeUserFromRoom(userConnection.userId, roomName);
          socket.emit('room_left', { room: roomName });
        }
      });

      // Handle dashboard subscription
      socket.on('subscribe_dashboard', (filters: any) => {
        const userConnection = this.getUserConnection(socket.id);
        if (userConnection) {
          this.handleDashboardSubscription(socket, userConnection, filters);
        }
      });

      // Handle activity updates
      socket.on('user_activity', (activity: any) => {
        const userConnection = this.getUserConnection(socket.id);
        if (userConnection) {
          this.broadcastUserActivity(userConnection, activity);
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleUserDisconnection(socket.id);
        console.log(`Client disconnected: ${socket.id}`);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    });
  }

  private async authenticateUser(sessionToken: string): Promise<any> {
    try {
      // This is a simplified authentication - in production, you'd want to verify the session properly
      // For now, we'll use a placeholder that you can replace with your actual auth logic
      const response = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/session`, {
        headers: {
          'Cookie': `next-auth.session-token=${sessionToken}`
        }
      });

      if (response.ok) {
        const session = await response.json();
        return session.user;
      }
      return null;
    } catch (error) {
      console.error('Session verification error:', error);
      return null;
    }
  }

  private async handleUserAuthentication(socket: any, user: any) {
    const userConnection: UserConnection = {
      userId: user.id,
      userRole: user.role || 'user',
      socketId: socket.id,
      connectedAt: new Date(),
      lastActivity: new Date(),
      permissions: RBAC.getRolePermissions(user.role || 'user'),
      rooms: []
    };

    this.userConnections.set(socket.id, userConnection);

    // Join default rooms based on role
    const defaultRooms = this.getDefaultRooms(user.role || 'user');
    for (const room of defaultRooms) {
      socket.join(room);
      this.addUserToRoom(user.id, room);
    }

    socket.emit('authenticated', {
      user: {
        id: user.id,
        role: user.role,
        permissions: userConnection.permissions
      },
      rooms: defaultRooms
    });

    // Broadcast user online status
    this.broadcastToRoom('user_online', {
      userId: user.id,
      userRole: user.role,
      timestamp: new Date().toISOString()
    }, 'system');
  }

  private getDefaultRooms(userRole: string): string[] {
    const rooms = ['system', 'notifications'];

    // Role-specific rooms
    if (RBAC.hasPermission(userRole, PERMISSIONS.OS_DASHBOARD_ACCESS)) {
      rooms.push('os_dashboard');
    }

    if (RBAC.hasPermission(userRole, PERMISSIONS.ADMIN_PANEL_ACCESS)) {
      rooms.push('admin_panel');
    }

    if (RBAC.hasPermission(userRole, PERMISSIONS.FINANCIAL_VIEW)) {
      rooms.push('financial_updates');
    }

    if (RBAC.hasPermission(userRole, PERMISSIONS.BOOKING_VIEW)) {
      rooms.push('booking_updates');
    }

    return rooms;
  }

  private canJoinRoom(userConnection: UserConnection, roomName: string): boolean {
    // System and notifications rooms are open to all authenticated users
    if (roomName === 'system' || roomName === 'notifications') {
      return true;
    }

    // Check role-based permissions for specific rooms
    switch (roomName) {
      case 'os_dashboard':
        return RBAC.hasPermission(userConnection.userRole, PERMISSIONS.OS_DASHBOARD_ACCESS);
      case 'admin_panel':
        return RBAC.hasPermission(userConnection.userRole, PERMISSIONS.ADMIN_PANEL_ACCESS);
      case 'financial_updates':
        return RBAC.hasPermission(userConnection.userRole, PERMISSIONS.FINANCIAL_VIEW);
      case 'booking_updates':
        return RBAC.hasPermission(userConnection.userRole, PERMISSIONS.BOOKING_VIEW);
      default:
        return false;
    }
  }

  private getUserConnection(socketId: string): UserConnection | undefined {
    return this.userConnections.get(socketId);
  }

  private addUserToRoom(userId: string, roomName: string) {
    if (!this.rooms.has(roomName)) {
      this.rooms.set(roomName, new Set());
    }
    this.rooms.get(roomName)!.add(userId);
  }

  private removeUserFromRoom(userId: string, roomName: string) {
    const room = this.rooms.get(roomName);
    if (room) {
      room.delete(userId);
      if (room.size === 0) {
        this.rooms.delete(roomName);
      }
    }
  }

  private handleDashboardSubscription(socket: any, userConnection: UserConnection, filters: any) {
    // Store subscription preferences
    socket.emit('dashboard_subscribed', {
      filters,
      timestamp: new Date().toISOString()
    });
  }

  private handleUserDisconnection(socketId: string) {
    const userConnection = this.userConnections.get(socketId);
    if (userConnection) {
      // Remove from all rooms
      for (const room of userConnection.rooms) {
        this.removeUserFromRoom(userConnection.userId, room);
      }

      // Broadcast user offline status
      this.broadcastToRoom('user_offline', {
        userId: userConnection.userId,
        userRole: userConnection.userRole,
        timestamp: new Date().toISOString()
      }, 'system');

      // Remove user connection
      this.userConnections.delete(socketId);
    }
  }

  private broadcastUserActivity(userConnection: UserConnection, activity: any) {
    const message: WebSocketMessage = {
      type: 'user_activity',
      data: {
        userId: userConnection.userId,
        userRole: userConnection.userRole,
        activity,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString(),
      userId: userConnection.userId,
      userRole: userConnection.userRole
    };

    this.broadcastToRoom('activity_update', message, 'system');
  }

  // Public methods for broadcasting updates
  public broadcastToRoom(event: string, data: any, room: string) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }

  public broadcastToUser(event: string, data: any, userId: string) {
    if (this.io) {
      // Find all socket connections for this user
      for (const [socketId, connection] of this.userConnections) {
        if (connection.userId === userId) {
          this.io.to(socketId).emit(event, data);
        }
      }
    }
  }

  public broadcastToRole(event: string, data: any, role: string) {
    if (this.io) {
      for (const [socketId, connection] of this.userConnections) {
        if (connection.userRole === role) {
          this.io.to(socketId).emit(event, data);
        }
      }
    }
  }

  public broadcastToAll(event: string, data: any) {
    if (this.io) {
      this.io.emit(event, data);
    }
  }

  public sendDashboardUpdate(update: DashboardUpdate) {
    const message: WebSocketMessage = {
      type: update.type,
      data: update.data,
      timestamp: update.timestamp
    };

    // Send to appropriate rooms based on update type
    switch (update.type) {
      case 'booking_update':
        this.broadcastToRoom('dashboard_update', message, 'booking_updates');
        break;
      case 'property_update':
        this.broadcastToRoom('dashboard_update', message, 'os_dashboard');
        break;
      case 'alert_update':
        this.broadcastToRoom('dashboard_update', message, 'notifications');
        break;
      case 'metric_update':
        this.broadcastToRoom('dashboard_update', message, 'os_dashboard');
        break;
      case 'user_activity':
        this.broadcastToRoom('dashboard_update', message, 'system');
        break;
    }

    // Send to specific users if affected
    if (update.affectedUsers) {
      for (const userId of update.affectedUsers) {
        this.broadcastToUser('dashboard_update', message, userId);
      }
    }
  }

  public getConnectedUsers(): UserConnection[] {
    return Array.from(this.userConnections.values());
  }

  public getRoomUsers(roomName: string): string[] {
    const room = this.rooms.get(roomName);
    return room ? Array.from(room) : [];
  }

  public getStats() {
    return {
      totalConnections: this.userConnections.size,
      totalRooms: this.rooms.size,
      rooms: Object.fromEntries(
        Array.from(this.rooms.entries()).map(([room, users]) => [
          room,
          users.size
        ])
      )
    };
  }
}

// Export singleton instance
export const webSocketManager = new WebSocketManager(); 