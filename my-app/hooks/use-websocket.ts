"use client"

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSession } from 'next-auth/react';

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

export interface WebSocketState {
  isConnected: boolean;
  isAuthenticated: boolean;
  isConnecting: boolean;
  error: string | null;
  rooms: string[];
  user: {
    id: string;
    role: string;
    permissions: string[];
  } | null;
}

export interface UseWebSocketReturn extends WebSocketState {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
  joinRoom: (roomName: string) => void;
  leaveRoom: (roomName: string) => void;
  subscribeDashboard: (filters?: any) => void;
  sendActivity: (activity: any) => void;
  onMessage: (event: string, callback: (data: any) => void) => void;
  offMessage: (event: string) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const { data: session, status } = useSession();
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    isAuthenticated: false,
    isConnecting: false,
    error: null,
    rooms: [],
    user: null
  });

  const messageCallbacks = useRef<Map<string, ((data: any) => void)[]>>(new Map());

  const connect = useCallback(() => {
    if (socketRef.current?.connected || state.isConnecting) {
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Create Socket.IO connection
      const socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000', {
        transports: ['websocket', 'polling'],
        autoConnect: false,
        withCredentials: true,
        timeout: 10000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: 5,
        forceNew: true
      });

      socketRef.current = socket;

      // Connection events
      socket.on('connect', () => {
        console.log('WebSocket connected');
        setState(prev => ({ 
          ...prev, 
          isConnected: true, 
          isConnecting: false,
          error: null 
        }));

        // Authenticate if session is available
        if (session?.user) {
          authenticate();
        }
      });

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason);
        setState(prev => ({ 
          ...prev, 
          isConnected: false, 
          isAuthenticated: false,
          isConnecting: false,
          error: reason === 'io server disconnect' ? 'Server disconnected' : null
        }));
      });

      socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        setState(prev => ({ 
          ...prev, 
          isConnecting: false,
          error: error.message || 'Connection failed'
        }));
      });

      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        setState(prev => ({ 
          ...prev, 
          error: error.message || 'WebSocket error'
        }));
      });

      // Authentication events
      socket.on('authenticated', (data: { user: any; rooms: string[] }) => {
        console.log('WebSocket authenticated:', data);
        setState(prev => ({ 
          ...prev, 
          isAuthenticated: true,
          user: data.user,
          rooms: data.rooms
        }));
      });

      socket.on('auth_error', (data: { message: string }) => {
        console.error('WebSocket authentication error:', data);
        setState(prev => ({ 
          ...prev, 
          isAuthenticated: false,
          error: data.message
        }));
      });

      // Room events
      socket.on('room_joined', (data: { room: string }) => {
        console.log('Joined room:', data.room);
        setState(prev => ({ 
          ...prev, 
          rooms: [...prev.rooms, data.room]
        }));
      });

      socket.on('room_left', (data: { room: string }) => {
        console.log('Left room:', data.room);
        setState(prev => ({ 
          ...prev, 
          rooms: prev.rooms.filter(room => room !== data.room)
        }));
      });

      socket.on('room_error', (data: { message: string; room: string }) => {
        console.error('Room error:', data);
        setState(prev => ({ 
          ...prev, 
          error: data.message
        }));
      });

      // Dashboard events
      socket.on('dashboard_subscribed', (data: any) => {
        console.log('Dashboard subscribed:', data);
      });

      socket.on('dashboard_update', (message: WebSocketMessage) => {
        console.log('Dashboard update received:', message);
        // Trigger callbacks for this event type
        const callbacks = messageCallbacks.current.get(message.type);
        if (callbacks) {
          callbacks.forEach(callback => callback(message.data));
        }
      });

      // User activity events
      socket.on('user_online', (data: any) => {
        console.log('User online:', data);
        const callbacks = messageCallbacks.current.get('user_online');
        if (callbacks) {
          callbacks.forEach(callback => callback(data));
        }
      });

      socket.on('user_offline', (data: any) => {
        console.log('User offline:', data);
        const callbacks = messageCallbacks.current.get('user_offline');
        if (callbacks) {
          callbacks.forEach(callback => callback(data));
        }
      });

      socket.on('activity_update', (message: WebSocketMessage) => {
        console.log('Activity update:', message);
        const callbacks = messageCallbacks.current.get('activity_update');
        if (callbacks) {
          callbacks.forEach(callback => callback(message.data));
        }
      });

      // Connect the socket
      socket.connect();

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setState(prev => ({ 
        ...prev, 
        isConnecting: false,
        error: 'Failed to create connection'
      }));
    }
  }, [session, authenticate, state.isConnecting]);

  const authenticate = useCallback(() => {
    if (!socketRef.current?.connected || !session?.user) {
      return;
    }

    // For now, we'll use a simple approach
    // In production, you'd want to get the actual session token
    socketRef.current.emit('authenticate', {
      sessionToken: 'placeholder' // Replace with actual session token
    });
  }, [session]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setState({
      isConnected: false,
      isAuthenticated: false,
      isConnecting: false,
      error: null,
      rooms: [],
      user: null
    });
  }, []);

  const joinRoom = useCallback((roomName: string) => {
    if (socketRef.current?.connected && state.isAuthenticated) {
      socketRef.current.emit('join_room', roomName);
    }
  }, [state.isAuthenticated]);

  const leaveRoom = useCallback((roomName: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_room', roomName);
    }
  }, []);

  const subscribeDashboard = useCallback((filters?: any) => {
    if (socketRef.current?.connected && state.isAuthenticated) {
      socketRef.current.emit('subscribe_dashboard', filters || {});
    }
  }, [state.isAuthenticated]);

  const sendActivity = useCallback((activity: any) => {
    if (socketRef.current?.connected && state.isAuthenticated) {
      socketRef.current.emit('user_activity', activity);
    }
  }, [state.isAuthenticated]);

  const onMessage = useCallback((event: string, callback: (data: any) => void) => {
    if (!messageCallbacks.current.has(event)) {
      messageCallbacks.current.set(event, []);
    }
    messageCallbacks.current.get(event)!.push(callback);
  }, []);

  const offMessage = useCallback((event: string) => {
    messageCallbacks.current.delete(event);
  }, []);

  // Auto-connect when session is available
  useEffect(() => {
    if (status === 'authenticated' && session?.user && !state.isConnected) {
      connect();
    }
  }, [status, session, connect, state.isConnected]);

  // Auto-authenticate when connected and session is available
  useEffect(() => {
    if (state.isConnected && !state.isAuthenticated && session?.user) {
      authenticate();
    }
  }, [state.isConnected, state.isAuthenticated, session, authenticate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    ...state,
    socket: socketRef.current,
    connect,
    disconnect,
    joinRoom,
    leaveRoom,
    subscribeDashboard,
    sendActivity,
    onMessage,
    offMessage
  };
} 