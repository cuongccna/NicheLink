import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  variables: string[];
  priority: NotificationPriority;
  category: NotificationCategory;
  isActive: boolean;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  categories: Record<NotificationCategory, {
    email: boolean;
    push: boolean;
    sms: boolean;
  }>;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:mm format
    endTime: string;
    timezone: string;
  };
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  isDelivered: boolean;
  deliveryChannels: {
    email?: {
      sent: boolean;
      sentAt?: Date;
      messageId?: string;
    };
    push?: {
      sent: boolean;
      sentAt?: Date;
      deviceIds?: string[];
    };
    sms?: {
      sent: boolean;
      sentAt?: Date;
      messageId?: string;
    };
    inApp: {
      sent: boolean;
      sentAt: Date;
      readAt?: Date;
    };
  };
  scheduledFor?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType = 
  | 'CAMPAIGN_CREATED'
  | 'CAMPAIGN_APPROVED' 
  | 'CAMPAIGN_REJECTED'
  | 'CAMPAIGN_COMPLETED'
  | 'KOC_APPLICATION'
  | 'KOC_APPROVED'
  | 'KOC_REJECTED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'TASK_OVERDUE'
  | 'CONTENT_SUBMITTED'
  | 'CONTENT_APPROVED'
  | 'CONTENT_REJECTED'
  | 'CONTENT_REVISION_REQUIRED'
  | 'MILESTONE_COMPLETED'
  | 'MILESTONE_OVERDUE'
  | 'PAYMENT_RELEASED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_FAILED'
  | 'MESSAGE_RECEIVED'
  | 'MENTION_RECEIVED'
  | 'FILE_SHARED'
  | 'SYSTEM_MAINTENANCE'
  | 'SECURITY_ALERT'
  | 'WELCOME'
  | 'REMINDER';

export type NotificationPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type NotificationCategory = 
  | 'CAMPAIGNS'
  | 'TASKS'
  | 'CONTENT'
  | 'PAYMENTS'
  | 'MESSAGES'
  | 'SYSTEM'
  | 'SECURITY';

export interface NotificationBatch {
  notifications: Array<{
    userId: string;
    type: NotificationType;
    data: Record<string, any>;
    scheduledFor?: Date;
  }>;
  template?: string;
  priority?: NotificationPriority;
}

export interface NotificationStats {
  totalSent: number;
  deliveryRate: {
    email: number;
    push: number;
    sms: number;
    inApp: number;
  };
  readRate: number;
  clickThroughRate: number;
  unsubscribeRate: number;
  byCategory: Record<NotificationCategory, number>;
  byPriority: Record<NotificationPriority, number>;
  recentTrends: Array<{
    date: string;
    sent: number;
    delivered: number;
    read: number;
  }>;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: number;
  sound?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class NotificationService {
  private prisma: PrismaClient;
  private templates: Map<NotificationType, NotificationTemplate>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.templates = new Map();
    this.initializeTemplates();
  }

  // Send a single notification
  async sendNotification(
    userId: string,
    type: NotificationType,
    data: Record<string, any> = {},
    options: {
      priority?: NotificationPriority;
      scheduledFor?: Date;
      channels?: ('email' | 'push' | 'sms' | 'inApp')[];
    } = {}
  ): Promise<Notification> {
    try {
      const template = this.templates.get(type);
      if (!template) {
        throw new AppError(`No template found for notification type: ${type}`, 400, 'TEMPLATE_NOT_FOUND');
      }

      // Get user preferences
      const preferences = await this.getUserPreferences(userId);
      const category = template.category;
      const priority = options.priority || template.priority;

      // Check if user wants to receive this type of notification
      if (!this.shouldSendNotification(preferences, category, priority)) {
        console.log(`Notification blocked by user preferences: ${userId}, ${type}`);
        return this.createNotificationRecord(userId, type, template, data, {
          ...options,
          priority,
          blocked: true
        });
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences) && priority !== 'URGENT') {
        console.log(`Notification delayed due to quiet hours: ${userId}, ${type}`);
        options.scheduledFor = this.calculateNextAvailableTime(preferences);
      }

      // Render notification content
      const { title, body } = this.renderTemplate(template, data);

      // Create notification record
      const notification = await this.createNotificationRecord(userId, type, template, data, {
        ...options,
        priority,
        title,
        body
      });

      // Send through appropriate channels
      if (!options.scheduledFor || options.scheduledFor <= new Date()) {
        await this.deliverNotification(notification, preferences, options.channels);
      }

      return notification;
    } catch (error) {
      console.error('Send notification failed:', error);
      throw error;
    }
  }

  // Send bulk notifications
  async sendBulkNotifications(batch: NotificationBatch): Promise<Notification[]> {
    try {
      const notifications: Notification[] = [];

      for (const notificationData of batch.notifications) {
        const options: {
          priority?: NotificationPriority;
          scheduledFor?: Date;
          channels?: ('email' | 'push' | 'sms' | 'inApp')[];
        } = {};
        
        if (batch.priority) {
          options.priority = batch.priority;
        }
        if (notificationData.scheduledFor) {
          options.scheduledFor = notificationData.scheduledFor;
        }

        const notification = await this.sendNotification(
          notificationData.userId,
          notificationData.type,
          notificationData.data,
          options
        );
        notifications.push(notification);
      }

      return notifications;
    } catch (error) {
      console.error('Send bulk notifications failed:', error);
      throw error;
    }
  }

  // Get user notifications with pagination
  async getUserNotifications(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      categories?: NotificationCategory[];
      isRead?: boolean;
      priority?: NotificationPriority;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
    hasMore: boolean;
  }> {
    try {
      const page = options.page || 1;
      const limit = options.limit || 20;
      const skip = (page - 1) * limit;

      const where: any = { userId };
      
      if (options.categories?.length) {
        where.category = { in: options.categories };
      }
      
      if (options.isRead !== undefined) {
        where.isRead = options.isRead;
      }
      
      if (options.priority) {
        where.priority = options.priority;
      }
      
      if (options.dateFrom || options.dateTo) {
        where.createdAt = {};
        if (options.dateFrom) where.createdAt.gte = options.dateFrom;
        if (options.dateTo) where.createdAt.lte = options.dateTo;
      }

      const [notifications, total, unreadCount]: any[] = await Promise.all([
        (this.prisma as any).notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        (this.prisma as any).notification.count({ where }),
        (this.prisma as any).notification.count({
          where: { userId, isRead: false }
        })
      ]);

      return {
        notifications: notifications.map((n: any) => this.mapNotificationFromDB(n)),
        total,
        unreadCount,
        hasMore: (page * limit) < total
      };
    } catch (error) {
      console.error('Get user notifications failed:', error);
      throw error;
    }
  }

  // Mark notifications as read
  async markAsRead(notificationIds: string[], userId: string): Promise<void> {
    try {
      await (this.prisma as any).notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          'deliveryChannels.inApp.readAt': new Date()
        }
      });
    } catch (error) {
      console.error('Mark notifications as read failed:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    try {
      await (this.prisma as any).notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true,
          'deliveryChannels.inApp.readAt': new Date()
        }
      });
    } catch (error) {
      console.error('Mark all notifications as read failed:', error);
      throw error;
    }
  }

  // Delete notifications
  async deleteNotifications(notificationIds: string[], userId: string): Promise<void> {
    try {
      await (this.prisma as any).notification.deleteMany({
        where: {
          id: { in: notificationIds },
          userId
        }
      });
    } catch (error) {
      console.error('Delete notifications failed:', error);
      throw error;
    }
  }

  // Get and update user notification preferences
  async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      let preferences: any = await (this.prisma as any).notificationPreferences.findUnique({
        where: { userId }
      });

      if (!preferences) {
        // Create default preferences
        preferences = await this.createDefaultPreferences(userId);
      }

      return this.mapPreferencesFromDB(preferences);
    } catch (error) {
      console.error('Get user preferences failed:', error);
      throw error;
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<NotificationPreferences> {
    try {
      const updated = await (this.prisma as any).notificationPreferences.upsert({
        where: { userId },
        update: preferences,
        create: {
          userId,
          ...preferences,
          ...this.getDefaultPreferencesData()
        }
      });

      return this.mapPreferencesFromDB(updated);
    } catch (error) {
      console.error('Update user preferences failed:', error);
      throw error;
    }
  }

  // Get notification statistics
  async getNotificationStats(
    userId?: string,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<NotificationStats> {
    try {
      const where: any = {};
      
      if (userId) {
        where.userId = userId;
      }
      
      if (dateFrom || dateTo) {
        where.createdAt = {};
        if (dateFrom) where.createdAt.gte = dateFrom;
        if (dateTo) where.createdAt.lte = dateTo;
      }

      const notifications: any[] = await (this.prisma as any).notification.findMany({
        where,
        select: {
          category: true,
          priority: true,
          isRead: true,
          isDelivered: true,
          deliveryChannels: true,
          createdAt: true
        }
      });

      const totalSent = notifications.length;
      const delivered = notifications.filter(n => n.isDelivered).length;
      const read = notifications.filter(n => n.isRead).length;

      // Calculate delivery rates by channel
      const emailSent = notifications.filter(n => n.deliveryChannels?.email?.sent).length;
      const pushSent = notifications.filter(n => n.deliveryChannels?.push?.sent).length;
      const smsSent = notifications.filter(n => n.deliveryChannels?.sms?.sent).length;
      const inAppSent = notifications.filter(n => n.deliveryChannels?.inApp?.sent).length;

      const deliveryRate = {
        email: emailSent > 0 ? (delivered / emailSent) * 100 : 0,
        push: pushSent > 0 ? (delivered / pushSent) * 100 : 0,
        sms: smsSent > 0 ? (delivered / smsSent) * 100 : 0,
        inApp: inAppSent > 0 ? (delivered / inAppSent) * 100 : 0
      };

      const readRate = totalSent > 0 ? (read / totalSent) * 100 : 0;
      const clickThroughRate = 0; // Would need click tracking
      const unsubscribeRate = 0; // Would need unsubscribe tracking

      // Group by category and priority
      const byCategory = notifications.reduce((acc: Record<string, number>, n) => {
        acc[n.category] = (acc[n.category] || 0) + 1;
        return acc;
      }, {});

      const byPriority = notifications.reduce((acc: Record<string, number>, n) => {
        acc[n.priority] = (acc[n.priority] || 0) + 1;
        return acc;
      }, {});

      // Generate recent trends (last 7 days)
      const recentTrends = this.generateTrendsData(notifications);

      return {
        totalSent,
        deliveryRate,
        readRate,
        clickThroughRate,
        unsubscribeRate,
        byCategory,
        byPriority,
        recentTrends
      };
    } catch (error) {
      console.error('Get notification stats failed:', error);
      throw error;
    }
  }

  // Process scheduled notifications
  async processScheduledNotifications(): Promise<void> {
    try {
      const scheduledNotifications: any[] = await (this.prisma as any).notification.findMany({
        where: {
          scheduledFor: {
            lte: new Date()
          },
          'deliveryChannels.inApp.sent': false
        },
        include: {
          user: true
        }
      });

      for (const notification of scheduledNotifications) {
        const preferences = await this.getUserPreferences(notification.userId);
        await this.deliverNotification(this.mapNotificationFromDB(notification), preferences);
      }
    } catch (error) {
      console.error('Process scheduled notifications failed:', error);
      throw error;
    }
  }

  // Real-time notification sending
  async sendRealTimeNotification(
    userId: string,
    type: NotificationType,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const notification = await this.sendNotification(userId, type, data, {
        priority: 'HIGH',
        channels: ['push', 'inApp']
      });

      // Emit real-time event (would integrate with WebSocket/Socket.IO)
      this.emitRealTimeEvent(userId, notification);
    } catch (error) {
      console.error('Send real-time notification failed:', error);
      throw error;
    }
  }

  // Helper methods for campaign-specific notifications
  async notifyCampaignCreated(campaignId: string, smeId: string): Promise<void> {
    await this.sendNotification(smeId, 'CAMPAIGN_CREATED', { campaignId });
  }

  async notifyKOCApplication(campaignId: string, kocId: string, smeId: string): Promise<void> {
    await Promise.all([
      this.sendNotification(kocId, 'KOC_APPLICATION', { campaignId }),
      this.sendNotification(smeId, 'KOC_APPLICATION', { campaignId, kocId })
    ]);
  }

  async notifyTaskAssigned(taskId: string, assigneeId: string, assignerId: string): Promise<void> {
    await this.sendNotification(assigneeId, 'TASK_ASSIGNED', { taskId, assignerId });
  }

  async notifyContentSubmitted(contentId: string, reviewerId: string, submitterId: string): Promise<void> {
    await Promise.all([
      this.sendNotification(submitterId, 'CONTENT_SUBMITTED', { contentId }),
      this.sendNotification(reviewerId, 'CONTENT_SUBMITTED', { contentId, submitterId })
    ]);
  }

  async notifyPaymentReleased(paymentId: string, recipientId: string, amount: number): Promise<void> {
    await this.sendNotification(recipientId, 'PAYMENT_RELEASED', { paymentId, amount });
  }

  async notifyMessageReceived(messageId: string, recipientId: string, senderId: string): Promise<void> {
    await this.sendRealTimeNotification(recipientId, 'MESSAGE_RECEIVED', { messageId, senderId });
  }

  // Private helper methods
  private initializeTemplates(): void {
    // Campaign templates
    this.templates.set('CAMPAIGN_CREATED', {
      id: 'campaign_created',
      type: 'CAMPAIGN_CREATED',
      title: 'Chiến dịch mới đã được tạo',
      body: 'Chiến dịch "{{campaignTitle}}" của bạn đã được tạo thành công và đang chờ phê duyệt.',
      variables: ['campaignTitle'],
      priority: 'MEDIUM',
      category: 'CAMPAIGNS',
      isActive: true
    });

    this.templates.set('KOC_APPLICATION', {
      id: 'koc_application',
      type: 'KOC_APPLICATION',
      title: 'Đơn ứng tuyển KOC mới',
      body: 'KOC {{kocName}} đã ứng tuyển cho chiến dịch "{{campaignTitle}}".',
      variables: ['kocName', 'campaignTitle'],
      priority: 'MEDIUM',
      category: 'CAMPAIGNS',
      isActive: true
    });

    this.templates.set('TASK_ASSIGNED', {
      id: 'task_assigned',
      type: 'TASK_ASSIGNED',
      title: 'Nhiệm vụ mới được giao',
      body: 'Bạn đã được giao nhiệm vụ "{{taskTitle}}" với hạn chót {{dueDate}}.',
      variables: ['taskTitle', 'dueDate'],
      priority: 'HIGH',
      category: 'TASKS',
      isActive: true
    });

    this.templates.set('CONTENT_APPROVED', {
      id: 'content_approved',
      type: 'CONTENT_APPROVED',
      title: 'Nội dung đã được phê duyệt',
      body: 'Nội dung "{{contentTitle}}" của bạn đã được phê duyệt với điểm số {{score}}/10.',
      variables: ['contentTitle', 'score'],
      priority: 'MEDIUM',
      category: 'CONTENT',
      isActive: true
    });

    this.templates.set('PAYMENT_RELEASED', {
      id: 'payment_released',
      type: 'PAYMENT_RELEASED',
      title: 'Thanh toán đã được giải ngân',
      body: 'Bạn đã nhận được thanh toán {{amount}} VND cho milestone "{{milestoneName}}".',
      variables: ['amount', 'milestoneName'],
      priority: 'HIGH',
      category: 'PAYMENTS',
      isActive: true
    });

    this.templates.set('MESSAGE_RECEIVED', {
      id: 'message_received',
      type: 'MESSAGE_RECEIVED',
      title: 'Tin nhắn mới',
      body: '{{senderName}} đã gửi tin nhắn cho bạn: "{{messagePreview}}"',
      variables: ['senderName', 'messagePreview'],
      priority: 'MEDIUM',
      category: 'MESSAGES',
      isActive: true
    });

    // Add more templates as needed...
  }

  private shouldSendNotification(
    preferences: NotificationPreferences,
    category: NotificationCategory,
    priority: NotificationPriority
  ): boolean {
    // Always send urgent notifications
    if (priority === 'URGENT') return true;

    // Check category preferences
    const categoryPrefs = preferences.categories[category];
    if (!categoryPrefs) return false;

    // Check if any delivery channel is enabled for this category
    return categoryPrefs.email || categoryPrefs.push || categoryPrefs.sms;
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // HH:mm format
    
    const start = preferences.quietHours.startTime;
    const end = preferences.quietHours.endTime;

    // Handle quiet hours that span midnight
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }

  private calculateNextAvailableTime(preferences: NotificationPreferences): Date {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const endTime = preferences.quietHours.endTime;
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    if (endHour !== undefined && endMinute !== undefined) {
      tomorrow.setHours(endHour, endMinute, 0, 0);
    }
    
    return tomorrow;
  }

  private renderTemplate(template: NotificationTemplate, data: Record<string, any>): {
    title: string;
    body: string;
  } {
    let title = template.title;
    let body = template.body;

    // Replace variables in template
    for (const variable of template.variables) {
      const value = data[variable] || '';
      const placeholder = `{{${variable}}}`;
      title = title.replace(new RegExp(placeholder, 'g'), value);
      body = body.replace(new RegExp(placeholder, 'g'), value);
    }

    return { title, body };
  }

  private async createNotificationRecord(
    userId: string,
    type: NotificationType,
    template: NotificationTemplate,
    data: Record<string, any>,
    options: any
  ): Promise<Notification> {
    const notificationData = {
      userId,
      type,
      category: template.category,
      priority: options.priority,
      title: options.title || template.title,
      body: options.body || template.body,
      data,
      isRead: false,
      isDelivered: false,
      deliveryChannels: {
        inApp: {
          sent: false,
          sentAt: new Date()
        }
      },
      scheduledFor: options.scheduledFor,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    if (options.blocked) {
      notificationData.deliveryChannels.inApp.sent = true;
      notificationData.isDelivered = true;
    }

    // Save to database
    const saved: any = await (this.prisma as any).notification.create({
      data: notificationData
    });

    return this.mapNotificationFromDB(saved);
  }

  private async deliverNotification(
    notification: Notification,
    preferences: NotificationPreferences,
    channels?: ('email' | 'push' | 'sms' | 'inApp')[]
  ): Promise<void> {
    const categoryPrefs = preferences.categories[notification.category];
    const deliveryPromises: Promise<any>[] = [];

    // Always deliver in-app notifications
    if (!channels || channels.includes('inApp')) {
      deliveryPromises.push(this.deliverInAppNotification(notification));
    }

    // Email notifications
    if ((!channels || channels.includes('email')) && 
        preferences.emailEnabled && 
        categoryPrefs?.email) {
      deliveryPromises.push(this.deliverEmailNotification(notification));
    }

    // Push notifications
    if ((!channels || channels.includes('push')) && 
        preferences.pushEnabled && 
        categoryPrefs?.push) {
      deliveryPromises.push(this.deliverPushNotification(notification));
    }

    // SMS notifications
    if ((!channels || channels.includes('sms')) && 
        preferences.smsEnabled && 
        categoryPrefs?.sms) {
      deliveryPromises.push(this.deliverSMSNotification(notification));
    }

    await Promise.allSettled(deliveryPromises);
  }

  private async deliverInAppNotification(notification: Notification): Promise<void> {
    // Update delivery status
    await (this.prisma as any).notification.update({
      where: { id: notification.id },
      data: {
        'deliveryChannels.inApp.sent': true,
        'deliveryChannels.inApp.sentAt': new Date(),
        isDelivered: true
      }
    });
  }

  private async deliverEmailNotification(notification: Notification): Promise<void> {
    try {
      // Integration with email service (e.g., SendGrid, AWS SES)
      const messageId = await this.sendEmail(notification);
      
      await (this.prisma as any).notification.update({
        where: { id: notification.id },
        data: {
          'deliveryChannels.email.sent': true,
          'deliveryChannels.email.sentAt': new Date(),
          'deliveryChannels.email.messageId': messageId
        }
      });
    } catch (error) {
      console.error('Email delivery failed:', error);
    }
  }

  private async deliverPushNotification(notification: Notification): Promise<void> {
    try {
      // Integration with push notification service (e.g., FCM, APNs)
      const deviceIds = await this.sendPushNotification(notification);
      
      await (this.prisma as any).notification.update({
        where: { id: notification.id },
        data: {
          'deliveryChannels.push.sent': true,
          'deliveryChannels.push.sentAt': new Date(),
          'deliveryChannels.push.deviceIds': deviceIds
        }
      });
    } catch (error) {
      console.error('Push notification delivery failed:', error);
    }
  }

  private async deliverSMSNotification(notification: Notification): Promise<void> {
    try {
      // Integration with SMS service (e.g., Twilio, AWS SNS)
      const messageId = await this.sendSMS(notification);
      
      await (this.prisma as any).notification.update({
        where: { id: notification.id },
        data: {
          'deliveryChannels.sms.sent': true,
          'deliveryChannels.sms.sentAt': new Date(),
          'deliveryChannels.sms.messageId': messageId
        }
      });
    } catch (error) {
      console.error('SMS delivery failed:', error);
    }
  }

  private async sendEmail(notification: Notification): Promise<string> {
    // Mock email sending - integrate with actual email service
    console.log(`Sending email notification: ${notification.title}`);
    return `email_${Date.now()}`;
  }

  private async sendPushNotification(notification: Notification): Promise<string[]> {
    // Mock push notification - integrate with FCM/APNs
    console.log(`Sending push notification: ${notification.title}`);
    return [`device_${Date.now()}`];
  }

  private async sendSMS(notification: Notification): Promise<string> {
    // Mock SMS sending - integrate with SMS service
    console.log(`Sending SMS notification: ${notification.title}`);
    return `sms_${Date.now()}`;
  }

  private emitRealTimeEvent(userId: string, notification: Notification): void {
    // Integration with WebSocket/Socket.IO for real-time notifications
    console.log(`Real-time notification for user ${userId}:`, notification.title);
  }

  private async createDefaultPreferences(userId: string): Promise<any> {
    const defaultData = this.getDefaultPreferencesData();
    
    return await (this.prisma as any).notificationPreferences.create({
      data: {
        userId,
        ...defaultData
      }
    });
  }

  private getDefaultPreferencesData(): any {
    return {
      emailEnabled: true,
      pushEnabled: true,
      smsEnabled: false,
      categories: {
        CAMPAIGNS: { email: true, push: true, sms: false },
        TASKS: { email: true, push: true, sms: false },
        CONTENT: { email: true, push: true, sms: false },
        PAYMENTS: { email: true, push: true, sms: true },
        MESSAGES: { email: false, push: true, sms: false },
        SYSTEM: { email: true, push: false, sms: false },
        SECURITY: { email: true, push: true, sms: true }
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'Asia/Ho_Chi_Minh'
      }
    };
  }

  private mapNotificationFromDB(dbNotification: any): Notification {
    return {
      id: dbNotification.id,
      userId: dbNotification.userId,
      type: dbNotification.type,
      category: dbNotification.category,
      priority: dbNotification.priority,
      title: dbNotification.title,
      body: dbNotification.body,
      data: dbNotification.data,
      isRead: dbNotification.isRead,
      isDelivered: dbNotification.isDelivered,
      deliveryChannels: dbNotification.deliveryChannels,
      ...(dbNotification.scheduledFor && { scheduledFor: new Date(dbNotification.scheduledFor) }),
      createdAt: new Date(dbNotification.createdAt),
      updatedAt: new Date(dbNotification.updatedAt)
    };
  }

  private mapPreferencesFromDB(dbPreferences: any): NotificationPreferences {
    return {
      userId: dbPreferences.userId,
      emailEnabled: dbPreferences.emailEnabled,
      pushEnabled: dbPreferences.pushEnabled,
      smsEnabled: dbPreferences.smsEnabled,
      categories: dbPreferences.categories,
      quietHours: dbPreferences.quietHours
    };
  }

  private generateTrendsData(notifications: any[]): Array<{
    date: string;
    sent: number;
    delivered: number;
    read: number;
  }> {
    const trends: Record<string, { sent: number; delivered: number; read: number }> = {};
    
    // Group notifications by date
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt).toISOString().split('T')[0];
      
      if (date) {
        if (!trends[date]) {
          trends[date] = { sent: 0, delivered: 0, read: 0 };
        }
        
        trends[date].sent++;
        if (notification.isDelivered) trends[date].delivered++;
        if (notification.isRead) trends[date].read++;
      }
    });

    // Convert to array and sort by date
    return Object.entries(trends)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7); // Last 7 days
  }
}

export default NotificationService;
