'use client';

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  tag?: string;
  actions?: NotificationAction[];
  timestamp?: number;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: 'maintenance' | 'housekeeping' | 'room' | 'system';
}

interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported: boolean = false;
  private permission: NotificationPermission = 'default';

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private async initialize() {
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

    if (this.isSupported) {
      this.permission = Notification.permission;
      await this.registerServiceWorker();
    }
  }

  private async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      this.registration = registration;
      console.log('Service Worker registered successfully');
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      return 'denied';
    }

    if (this.permission === 'default') {
      this.permission = await Notification.requestPermission();
    }

    return this.permission;
  }

  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration || this.permission !== 'granted') {
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });

      await this.sendSubscriptionToServer(subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription) {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userId: localStorage.getItem('userId'),
          role: localStorage.getItem('userRole')
        }),
      });
    } catch (error) {
      console.error('Failed to send subscription to server:', error);
    }
  }

  async showNotification(payload: NotificationPayload) {
    if (!this.registration || this.permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted or no registration');
      return;
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icons/notification-icon.png',
      badge: payload.badge || '/icons/badge-icon.png',
      data: {
        ...payload.data,
        timestamp: payload.timestamp || Date.now(),
        category: payload.category || 'system'
      },
      tag: payload.tag,
      actions: payload.actions,
      requireInteraction: payload.priority === 'urgent',
      silent: payload.priority === 'low',
      vibrate: this.getVibrationPattern(payload.priority)
    };

    try {
      await this.registration.showNotification(payload.title, options);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  private getVibrationPattern(priority?: string): number[] {
    switch (priority) {
      case 'urgent':
        return [200, 100, 200, 100, 200];
      case 'high':
        return [200, 100, 200];
      case 'normal':
        return [200];
      case 'low':
      default:
        return [];
    }
  }

  async sendMaintenanceAlert(alert: {
    roomId: string;
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
    type: string;
  }) {
    const payload: NotificationPayload = {
      title: `🔧 ${alert.title}`,
      body: `Room ${alert.roomId}: ${alert.description}`,
      icon: '/icons/maintenance-icon.png',
      data: {
        roomId: alert.roomId,
        type: 'maintenance',
        priority: alert.priority,
        url: `/os/maintenance/${alert.roomId}`
      },
      tag: `maintenance-${alert.roomId}`,
      priority: alert.priority as any,
      category: 'maintenance',
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'assign',
          title: 'Assign Task',
          icon: '/icons/assign-icon.png'
        }
      ]
    };

    await this.showNotification(payload);
  }

  async sendHousekeepingAlert(task: {
    id: string;
    roomId: string;
    type: string;
    priority: string;
    dueTime?: Date;
  }) {
    const isOverdue = task.dueTime && new Date() > task.dueTime;
    const payload: NotificationPayload = {
      title: isOverdue ? '⏰ Overdue Task' : '🧹 Housekeeping Task',
      body: `Room ${task.roomId}: ${task.type} ${isOverdue ? 'is overdue' : 'assigned'}`,
      icon: '/icons/housekeeping-icon.png',
      data: {
        taskId: task.id,
        roomId: task.roomId,
        type: 'housekeeping',
        url: `/os/housekeeping/${task.id}`
      },
      tag: `housekeeping-${task.id}`,
      priority: isOverdue ? 'high' : 'normal',
      category: 'housekeeping',
      actions: [
        {
          action: 'start',
          title: 'Start Task',
          icon: '/icons/start-icon.png'
        },
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/view-icon.png'
        }
      ]
    };

    await this.showNotification(payload);
  }

  async sendRoomStatusAlert(room: {
    id: string;
    number: string;
    status: string;
    previousStatus?: string;
  }) {
    const payload: NotificationPayload = {
      title: '🏨 Room Status Update',
      body: `Room ${room.number} changed from ${room.previousStatus || 'unknown'} to ${room.status}`,
      icon: '/icons/room-icon.png',
      data: {
        roomId: room.id,
        type: 'room_status',
        url: `/os/rooms/${room.id}`
      },
      tag: `room-status-${room.id}`,
      priority: 'normal',
      category: 'room'
    };

    await this.showNotification(payload);
  }

  async sendInventoryAlert(item: {
    id: string;
    name: string;
    roomId: string;
    status: 'low_stock' | 'out_of_stock' | 'damaged' | 'needs_replacement';
  }) {
    const statusMessages = {
      low_stock: 'is running low',
      out_of_stock: 'is out of stock',
      damaged: 'is damaged',
      needs_replacement: 'needs replacement'
    };

    const payload: NotificationPayload = {
      title: '📦 Inventory Alert',
      body: `${item.name} in Room ${item.roomId} ${statusMessages[item.status]}`,
      icon: '/icons/inventory-icon.png',
      data: {
        itemId: item.id,
        roomId: item.roomId,
        type: 'inventory',
        url: `/os/rooms/${item.roomId}/inventory`
      },
      tag: `inventory-${item.id}`,
      priority: item.status === 'out_of_stock' ? 'high' : 'normal',
      category: 'system'
    };

    await this.showNotification(payload);
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscription,
            userId: localStorage.getItem('userId')
          }),
        });
      }
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }
}

export const pushNotificationService = new PushNotificationService();

export function useNotificationPermission() {
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = React.useState(false);

  React.useEffect(() => {
    setPermission(pushNotificationService.getPermissionStatus());
    setIsSupported(pushNotificationService.isNotificationSupported());
  }, []);

  const requestPermission = React.useCallback(async () => {
    const newPermission = await pushNotificationService.requestPermission();
    setPermission(newPermission);
    return newPermission;
  }, []);

  const subscribe = React.useCallback(async () => {
    return await pushNotificationService.subscribeToPush();
  }, []);

  return {
    permission,
    isSupported,
    requestPermission,
    subscribe
  };
}