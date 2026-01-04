/**
 * Socket.io Service
 * Real-time communication for messaging
 */

import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/constants/api';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  isOwn: boolean;
}

interface TypingStatus {
  userId: string;
  userName: string;
  isTyping: boolean;
}

type MessageCallback = (message: Message) => void;
type TypingCallback = (status: TypingStatus) => void;
type ConnectionCallback = (connected: boolean) => void;

class SocketService {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private messageCallbacks: Map<string, MessageCallback> = new Map();
  private typingCallbacks: Map<string, TypingCallback> = new Map();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();

  /**
   * Initialize socket connection
   */
  connect(userId: string, authToken: string): void {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    // Create socket connection
    this.socket = io(API_CONFIG.BASE_URL, {
      auth: {
        token: authToken,
        userId,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Connection event handlers
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.notifyConnectionChange(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
      this.notifyConnectionChange(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    // Message event handler
    this.socket.on('message:new', (message: Message) => {
      console.log('New message received:', message);
      this.notifyNewMessage(message);
    });

    // Typing event handler
    this.socket.on('user:typing', (status: TypingStatus) => {
      console.log('Typing status:', status);
      this.notifyTypingChange(status);
    });
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Join a conversation room
   */
  joinConversation(propertyId: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('conversation:join', { propertyId });
  }

  /**
   * Leave a conversation room
   */
  leaveConversation(propertyId: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('conversation:leave', { propertyId });
  }

  /**
   * Send a message
   */
  sendMessage(propertyId: string, text: string): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('message:send', {
      propertyId,
      text,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send typing indicator
   */
  sendTypingStatus(propertyId: string, isTyping: boolean): void {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('user:typing', {
      propertyId,
      isTyping,
    });
  }

  /**
   * Subscribe to new messages
   */
  onNewMessage(conversationId: string, callback: MessageCallback): void {
    this.messageCallbacks.set(conversationId, callback);
  }

  /**
   * Unsubscribe from messages
   */
  offNewMessage(conversationId: string): void {
    this.messageCallbacks.delete(conversationId);
  }

  /**
   * Subscribe to typing status
   */
  onTypingChange(conversationId: string, callback: TypingCallback): void {
    this.typingCallbacks.set(conversationId, callback);
  }

  /**
   * Unsubscribe from typing status
   */
  offTypingChange(conversationId: string): void {
    this.typingCallbacks.delete(conversationId);
  }

  /**
   * Subscribe to connection status
   */
  onConnectionChange(callback: ConnectionCallback): void {
    this.connectionCallbacks.add(callback);
  }

  /**
   * Unsubscribe from connection status
   */
  offConnectionChange(callback: ConnectionCallback): void {
    this.connectionCallbacks.delete(callback);
  }

  /**
   * Notify message callbacks
   */
  private notifyNewMessage(message: Message): void {
    this.messageCallbacks.forEach((callback) => {
      callback(message);
    });
  }

  /**
   * Notify typing callbacks
   */
  private notifyTypingChange(status: TypingStatus): void {
    this.typingCallbacks.forEach((callback) => {
      callback(status);
    });
  }

  /**
   * Notify connection callbacks
   */
  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => {
      callback(connected);
    });
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

export const socketService = new SocketService();
