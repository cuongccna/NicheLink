import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: boolean;
  vibrate?: boolean;
}

class NotificationService {
  private expoPushToken: string | null = null;

  async initialize(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.warn('Must use physical device for Push Notifications');
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
        console.warn('Push notification permission not granted');
        return null;
      }

      // Get the token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your actual project ID
      });

      this.expoPushToken = token.data;
      await this.storeToken(token.data);

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
          sound: 'default',
        });

        // Create specific channels for different notification types
        await Notifications.setNotificationChannelAsync('campaigns', {
          name: 'Campaign Updates',
          description: 'Notifications about campaign updates and new opportunities',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Messages',
          description: 'Chat messages and communications',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#007AFF',
          sound: 'default',
        });

        await Notifications.setNotificationChannelAsync('payments', {
          name: 'Payment Alerts',
          description: 'Payment confirmations and financial updates',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 500, 250, 500],
          lightColor: '#34C759',
          sound: 'default',
        });
      }

      return token.data;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return null;
    }
  }

  async getToken(): Promise<string | null> {
    if (this.expoPushToken) {
      return this.expoPushToken;
    }

    const storedToken = await AsyncStorage.getItem('expoPushToken');
    if (storedToken) {
      this.expoPushToken = storedToken;
      return storedToken;
    }

    return await this.initialize();
  }

  private async storeToken(token: string): Promise<void> {
    await AsyncStorage.setItem('expoPushToken', token);
  }

  async scheduleLocalNotification(
    notification: NotificationData,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: notification.sound !== false ? 'default' : undefined,
        vibrate: notification.vibrate !== false ? [0, 250, 250, 250] : undefined,
      },
      trigger: trigger || null, // null means immediate
    });

    return notificationId;
  }

  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  // Register notification listeners
  addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  // Send token to your backend
  async registerTokenWithBackend(userId: string): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        return false;
      }

      // Replace with your actual API endpoint
      const response = await fetch('https://your-api-domain.com/api/v1/notifications/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add authorization header if needed
        },
        body: JSON.stringify({
          userId,
          pushToken: token,
          platform: Platform.OS,
          deviceId: Device.osInternalBuildId,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error registering token with backend:', error);
      return false;
    }
  }

  // Helper methods for specific notification types
  async sendCampaignNotification(campaignTitle: string, message: string): Promise<string> {
    return this.scheduleLocalNotification({
      title: `📢 ${campaignTitle}`,
      body: message,
      data: { type: 'campaign', timestamp: Date.now() },
    });
  }

  async sendMessageNotification(senderName: string, message: string): Promise<string> {
    return this.scheduleLocalNotification({
      title: `💬 Message from ${senderName}`,
      body: message,
      data: { type: 'message', sender: senderName, timestamp: Date.now() },
    });
  }

  async sendPaymentNotification(amount: string, type: 'received' | 'sent'): Promise<string> {
    const emoji = type === 'received' ? '💰' : '💸';
    const action = type === 'received' ? 'received' : 'sent';
    
    return this.scheduleLocalNotification({
      title: `${emoji} Payment ${action}`,
      body: `You have ${action} $${amount}`,
      data: { type: 'payment', amount, action, timestamp: Date.now() },
    });
  }
}

export default new NotificationService();
