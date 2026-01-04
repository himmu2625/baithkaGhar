/**
 * Notification Service
 * Handles push notifications via Expo Push Notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from './api';
import { storage } from './storage';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationData {
  type: 'booking_confirmed' | 'booking_cancelled' | 'check_in_reminder' | 'new_message' | 'payment_success';
  bookingId?: string;
  propertyId?: string;
  messageId?: string;
  title?: string;
  body?: string;
}

class NotificationService {
  private expoPushToken: string | null = null;

  /**
   * Initialize notifications
   */
  async initialize(): Promise<void> {
    try {
      // Request permissions
      const token = await this.registerForPushNotifications();
      if (token) {
        this.expoPushToken = token;
        await this.savePushToken(token);
      }

      // Set up notification listeners
      this.setupNotificationListeners();
    } catch (error) {
      console.error('Initialize notifications error:', error);
    }
  }

  /**
   * Register for push notifications
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Check if running on physical device
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return null;
      }

      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permissions not granted');
        return null;
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('Expo Push Token:', token.data);

      // Android-specific channel setup
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1a1a1a',
        });

        // Create booking channel
        await Notifications.setNotificationChannelAsync('bookings', {
          name: 'Bookings',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1a1a1a',
          description: 'Booking confirmations and updates',
        });

        // Create messages channel
        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250],
          lightColor: '#1a1a1a',
          description: 'New messages from property owners',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Register push notifications error:', error);
      return null;
    }
  }

  /**
   * Save push token to backend
   */
  async savePushToken(token: string): Promise<void> {
    try {
      await api.post('/api/user/push-token', { token });
      await storage.setItem('push_token', token);
    } catch (error) {
      console.error('Save push token error:', error);
    }
  }

  /**
   * Remove push token from backend
   */
  async removePushToken(): Promise<void> {
    try {
      const token = await storage.getItem('push_token');
      if (token) {
        await api.delete('/api/user/push-token', { data: { token } });
        await storage.removeItem('push_token');
      }
    } catch (error) {
      console.error('Remove push token error:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  private setupNotificationListeners(): void {
    // Notification received while app is foregrounded
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    // Notification tapped/opened
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification tap
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data as NotificationData;

    // Navigate based on notification type
    switch (data.type) {
      case 'booking_confirmed':
      case 'booking_cancelled':
      case 'check_in_reminder':
        if (data.bookingId) {
          // Navigate to booking details
          // router.push(`/booking/details/${data.bookingId}`);
        }
        break;

      case 'new_message':
        if (data.propertyId) {
          // Navigate to messages
          // router.push(`/messages/${data.propertyId}`);
        }
        break;

      case 'payment_success':
        if (data.bookingId) {
          // Navigate to booking success
          // router.push(`/booking/success?bookingId=${data.bookingId}`);
        }
        break;
    }
  }

  /**
   * Schedule local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    data: NotificationData,
    triggerSeconds: number = 0
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          categoryIdentifier: data.type,
        },
        trigger: triggerSeconds > 0 ? { seconds: triggerSeconds } : null,
      });

      return identifier;
    } catch (error) {
      console.error('Schedule notification error:', error);
      throw error;
    }
  }

  /**
   * Cancel scheduled notification
   */
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Cancel notification error:', error);
    }
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Cancel all notifications error:', error);
    }
  }

  /**
   * Get badge count
   */
  async getBadgeCount(): Promise<number> {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Get badge count error:', error);
      return 0;
    }
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Set badge count error:', error);
    }
  }

  /**
   * Clear badge count
   */
  async clearBadgeCount(): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch (error) {
      console.error('Clear badge count error:', error);
    }
  }

  /**
   * Schedule check-in reminder (24 hours before)
   */
  async scheduleCheckInReminder(
    bookingId: string,
    propertyName: string,
    checkInDate: Date
  ): Promise<string | null> {
    try {
      const now = new Date();
      const reminderTime = new Date(checkInDate);
      reminderTime.setHours(reminderTime.getHours() - 24); // 24 hours before

      if (reminderTime <= now) {
        console.log('Check-in is less than 24 hours away, skipping reminder');
        return null;
      }

      const secondsUntilReminder = Math.floor((reminderTime.getTime() - now.getTime()) / 1000);

      const identifier = await this.scheduleLocalNotification(
        'Check-in Reminder',
        `Your check-in at ${propertyName} is tomorrow!`,
        {
          type: 'check_in_reminder',
          bookingId,
        },
        secondsUntilReminder
      );

      return identifier;
    } catch (error) {
      console.error('Schedule check-in reminder error:', error);
      return null;
    }
  }

  /**
   * Send booking confirmation notification
   */
  async sendBookingConfirmation(
    bookingId: string,
    propertyName: string,
    checkInDate: string
  ): Promise<void> {
    try {
      await this.scheduleLocalNotification(
        'Booking Confirmed! 🎉',
        `Your booking at ${propertyName} is confirmed for ${new Date(checkInDate).toLocaleDateString()}`,
        {
          type: 'booking_confirmed',
          bookingId,
        }
      );
    } catch (error) {
      console.error('Send booking confirmation error:', error);
    }
  }

  /**
   * Send new message notification
   */
  async sendNewMessageNotification(
    propertyId: string,
    propertyName: string,
    messagePreview: string
  ): Promise<void> {
    try {
      await this.scheduleLocalNotification(
        `New message from ${propertyName}`,
        messagePreview,
        {
          type: 'new_message',
          propertyId,
        }
      );
    } catch (error) {
      console.error('Send message notification error:', error);
    }
  }

  /**
   * Get Expo Push Token
   */
  getExpoPushToken(): string | null {
    return this.expoPushToken;
  }
}

export const notificationService = new NotificationService();
