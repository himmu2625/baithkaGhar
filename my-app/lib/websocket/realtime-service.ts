'use client';

import { io, Socket } from 'socket.io-client';

export interface RoomStatusUpdate {
  roomId: string;
  status: string;
  timestamp: Date;
  updatedBy: string;
  metadata?: Record<string, any>;
}

export interface HousekeepingTaskUpdate {
  taskId: string;
  status: string;
  assignedTo?: string;
  completedAt?: Date;
  notes?: string;
  roomId?: string;
}

export interface MaintenanceAlert {
  id: string;
  roomId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  type: string;
  description: string;
  reportedBy: string;
  timestamp: Date;
}

class RealtimeService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected = false;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect() {
    try {
      this.socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || window.location.origin, {
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: false,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('Failed to initialize WebSocket connection:', error);
    }
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection', { status: 'connected' });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('connection', { status: 'disconnected', reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.emit('connection', { status: 'error', error });
    });

    this.socket.on('room:status:updated', (data: RoomStatusUpdate) => {
      this.emit('room:status', data);
    });

    this.socket.on('housekeeping:task:updated', (data: HousekeepingTaskUpdate) => {
      this.emit('housekeeping:task', data);
    });

    this.socket.on('maintenance:alert', (data: MaintenanceAlert) => {
      this.emit('maintenance:alert', data);
    });

    this.socket.on('inventory:updated', (data: any) => {
      this.emit('inventory:updated', data);
    });
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  public on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => this.off(event, callback);
  }

  public off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  public joinRoom(roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('room:join', { roomId });
    }
  }

  public leaveRoom(roomId: string) {
    if (this.socket && this.isConnected) {
      this.socket.emit('room:leave', { roomId });
    }
  }

  public updateRoomStatus(roomId: string, status: string, metadata?: Record<string, any>) {
    if (this.socket && this.isConnected) {
      this.socket.emit('room:status:update', {
        roomId,
        status,
        timestamp: new Date(),
        metadata
      });
    }
  }

  public updateHousekeepingTask(taskId: string, updates: Partial<HousekeepingTaskUpdate>) {
    if (this.socket && this.isConnected) {
      this.socket.emit('housekeeping:task:update', {
        taskId,
        ...updates,
        timestamp: new Date()
      });
    }
  }

  public sendMaintenanceAlert(alert: Omit<MaintenanceAlert, 'id' | 'timestamp'>) {
    if (this.socket && this.isConnected) {
      this.socket.emit('maintenance:alert:send', {
        ...alert,
        id: crypto.randomUUID(),
        timestamp: new Date()
      });
    }
  }

  public getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  public reconnect() {
    this.disconnect();
    this.connect();
  }
}

export const realtimeService = new RealtimeService();

export function useRealtimeConnection() {
  const [connectionStatus, setConnectionStatus] = React.useState({
    isConnected: false,
    reconnectAttempts: 0
  });

  React.useEffect(() => {
    const updateStatus = () => {
      setConnectionStatus(realtimeService.getConnectionStatus());
    };

    const unsubscribe = realtimeService.on('connection', updateStatus);
    updateStatus();

    return unsubscribe;
  }, []);

  return connectionStatus;
}

export function useRoomStatus(roomId: string) {
  const [roomStatus, setRoomStatus] = React.useState<RoomStatusUpdate | null>(null);

  React.useEffect(() => {
    if (roomId) {
      realtimeService.joinRoom(roomId);

      const unsubscribe = realtimeService.on('room:status', (data: RoomStatusUpdate) => {
        if (data.roomId === roomId) {
          setRoomStatus(data);
        }
      });

      return () => {
        realtimeService.leaveRoom(roomId);
        unsubscribe();
      };
    }
  }, [roomId]);

  return roomStatus;
}

export function useHousekeepingUpdates() {
  const [updates, setUpdates] = React.useState<HousekeepingTaskUpdate[]>([]);

  React.useEffect(() => {
    const unsubscribe = realtimeService.on('housekeeping:task', (data: HousekeepingTaskUpdate) => {
      setUpdates(prev => [data, ...prev.slice(0, 99)]);
    });

    return unsubscribe;
  }, []);

  return updates;
}

export function useMaintenanceAlerts() {
  const [alerts, setAlerts] = React.useState<MaintenanceAlert[]>([]);

  React.useEffect(() => {
    const unsubscribe = realtimeService.on('maintenance:alert', (data: MaintenanceAlert) => {
      setAlerts(prev => [data, ...prev.slice(0, 49)]);
    });

    return unsubscribe;
  }, []);

  return alerts;
}