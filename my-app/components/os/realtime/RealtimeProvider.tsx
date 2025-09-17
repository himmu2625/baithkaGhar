'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { realtimeService, RoomStatusUpdate, HousekeepingTaskUpdate, MaintenanceAlert } from '@/lib/websocket/realtime-service';
import { pushNotificationService } from '@/lib/notifications/push-service';
import { useToast } from '@/components/ui/use-toast';

interface RealtimeContextType {
  isConnected: boolean;
  roomStatus: Map<string, RoomStatusUpdate>;
  housekeepingUpdates: HousekeepingTaskUpdate[];
  maintenanceAlerts: MaintenanceAlert[];
  joinRoom: (roomId: string) => void;
  leaveRoom: (roomId: string) => void;
  updateRoomStatus: (roomId: string, status: string, metadata?: Record<string, any>) => void;
  updateHousekeepingTask: (taskId: string, updates: Partial<HousekeepingTaskUpdate>) => void;
  sendMaintenanceAlert: (alert: Omit<MaintenanceAlert, 'id' | 'timestamp'>) => void;
  clearAlert: (alertId: string) => void;
}

const RealtimeContext = createContext<RealtimeContextType | null>(null);

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [roomStatus, setRoomStatus] = useState<Map<string, RoomStatusUpdate>>(new Map());
  const [housekeepingUpdates, setHousekeepingUpdates] = useState<HousekeepingTaskUpdate[]>([]);
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeConnection = realtimeService.on('connection', (data) => {
      setIsConnected(data.status === 'connected');

      if (data.status === 'connected') {
        toast({
          title: 'Connected',
          description: 'Real-time updates are now active',
          duration: 3000,
        });
      } else if (data.status === 'disconnected') {
        toast({
          title: 'Disconnected',
          description: 'Attempting to reconnect...',
          variant: 'destructive',
          duration: 3000,
        });
      }
    });

    const unsubscribeRoomStatus = realtimeService.on('room:status', (data: RoomStatusUpdate) => {
      setRoomStatus(prev => new Map(prev.set(data.roomId, data)));

      toast({
        title: 'Room Status Updated',
        description: `Room ${data.roomId} status changed to ${data.status}`,
        duration: 3000,
      });
    });

    const unsubscribeHousekeeping = realtimeService.on('housekeeping:task', (data: HousekeepingTaskUpdate) => {
      setHousekeepingUpdates(prev => [data, ...prev.slice(0, 99)]);

      toast({
        title: 'Task Updated',
        description: `Housekeeping task ${data.taskId} status: ${data.status}`,
        duration: 3000,
      });

      if (data.status === 'completed') {
        pushNotificationService.sendHousekeepingAlert({
          id: data.taskId,
          roomId: data.roomId || '',
          type: 'Task Completed',
          priority: 'normal'
        });
      }
    });

    const unsubscribeMaintenanceAlerts = realtimeService.on('maintenance:alert', (data: MaintenanceAlert) => {
      setMaintenanceAlerts(prev => [data, ...prev.slice(0, 49)]);

      const priorityColors = {
        low: 'bg-gray-500',
        medium: 'bg-yellow-500',
        high: 'bg-orange-500',
        urgent: 'bg-red-500',
        emergency: 'bg-red-600'
      };

      toast({
        title: `🚨 ${data.priority.toUpperCase()} Maintenance Alert`,
        description: `Room ${data.roomId}: ${data.description}`,
        variant: data.priority === 'urgent' || data.priority === 'emergency' ? 'destructive' : 'default',
        duration: data.priority === 'urgent' || data.priority === 'emergency' ? 10000 : 5000,
      });

      pushNotificationService.sendMaintenanceAlert({
        roomId: data.roomId,
        title: data.type,
        description: data.description,
        priority: data.priority,
        type: data.type
      });
    });

    const unsubscribeInventory = realtimeService.on('inventory:updated', (data) => {
      toast({
        title: 'Inventory Updated',
        description: `Room ${data.roomId} inventory has been modified`,
        duration: 3000,
      });
    });

    return () => {
      unsubscribeConnection();
      unsubscribeRoomStatus();
      unsubscribeHousekeeping();
      unsubscribeMaintenanceAlerts();
      unsubscribeInventory();
    };
  }, [toast]);

  const joinRoom = (roomId: string) => {
    realtimeService.joinRoom(roomId);
  };

  const leaveRoom = (roomId: string) => {
    realtimeService.leaveRoom(roomId);
  };

  const updateRoomStatus = (roomId: string, status: string, metadata?: Record<string, any>) => {
    realtimeService.updateRoomStatus(roomId, status, metadata);

    fetch('/api/socket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'room_status_update',
        data: { roomId, status, metadata, timestamp: new Date() }
      })
    }).catch(error => console.error('Failed to broadcast room status:', error));
  };

  const updateHousekeepingTask = (taskId: string, updates: Partial<HousekeepingTaskUpdate>) => {
    realtimeService.updateHousekeepingTask(taskId, updates);

    fetch('/api/socket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'housekeeping_task_update',
        data: { taskId, ...updates, timestamp: new Date() }
      })
    }).catch(error => console.error('Failed to broadcast task update:', error));
  };

  const sendMaintenanceAlert = (alert: Omit<MaintenanceAlert, 'id' | 'timestamp'>) => {
    const fullAlert = {
      ...alert,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    realtimeService.sendMaintenanceAlert(alert);

    fetch('/api/socket', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'maintenance_alert',
        data: fullAlert
      })
    }).catch(error => console.error('Failed to broadcast maintenance alert:', error));

    fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'maintenance',
        category: 'maintenance',
        payload: {
          title: `🔧 ${alert.type}`,
          body: `Room ${alert.roomId}: ${alert.description}`,
          icon: '/icons/maintenance-icon.png',
          data: {
            alertId: fullAlert.id,
            roomId: alert.roomId,
            priority: alert.priority
          },
          actions: [
            { action: 'view', title: 'View Details' },
            { action: 'assign', title: 'Assign Task' }
          ]
        }
      })
    }).catch(error => console.error('Failed to send push notification:', error));
  };

  const clearAlert = (alertId: string) => {
    setMaintenanceAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const contextValue: RealtimeContextType = {
    isConnected,
    roomStatus,
    housekeepingUpdates,
    maintenanceAlerts,
    joinRoom,
    leaveRoom,
    updateRoomStatus,
    updateHousekeepingTask,
    sendMaintenanceAlert,
    clearAlert
  };

  return (
    <RealtimeContext.Provider value={contextValue}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime(): RealtimeContextType {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}

export function useRoomRealtime(roomId: string) {
  const { joinRoom, leaveRoom, roomStatus, updateRoomStatus } = useRealtime();

  useEffect(() => {
    if (roomId) {
      joinRoom(roomId);
      return () => leaveRoom(roomId);
    }
  }, [roomId, joinRoom, leaveRoom]);

  return {
    status: roomStatus.get(roomId),
    updateStatus: (status: string, metadata?: Record<string, any>) =>
      updateRoomStatus(roomId, status, metadata)
  };
}