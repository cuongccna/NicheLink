import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  conversationId?: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'VIDEO' | 'SYSTEM';
  attachments?: MessageAttachment[];
  isRead: boolean;
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAttachment {
  id: string;
  type: 'IMAGE' | 'FILE' | 'VOICE' | 'VIDEO';
  url: string;
  filename: string;
  fileSize: number;
  mimeType: string;
}

export interface Conversation {
  id: string;
  type: 'DIRECT' | 'GROUP' | 'CAMPAIGN';
  title?: string;
  description?: string;
  campaignId?: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  joinedAt: Date;
  lastSeenAt?: Date;
  isActive: boolean;
}

export interface MessageThread {
  conversation: Conversation;
  messages: Message[];
  totalMessages: number;
  hasMore: boolean;
}

export interface MessagingNotification {
  id: string;
  userId: string;
  type: 'NEW_MESSAGE' | 'MENTION' | 'CONVERSATION_INVITE' | 'FILE_SHARED';
  title: string;
  content: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export class MessagingService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create or get direct conversation between two users
  async getOrCreateDirectConversation(userId1: string, userId2: string): Promise<Conversation> {
    try {
      // Check if conversation already exists
      const existingConversation: any = await (this.prisma as any).conversation.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: {
                in: [userId1, userId2]
              }
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true }
              }
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (existingConversation) {
        return this.mapPrismaConversationToConversation(existingConversation);
      }

      // Create new conversation
      const conversation: any = await (this.prisma as any).conversation.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [
              {
                userId: userId1,
                role: 'MEMBER',
                isActive: true,
                joinedAt: new Date()
              },
              {
                userId: userId2,
                role: 'MEMBER',
                isActive: true,
                joinedAt: new Date()
              }
            ]
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true }
              }
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return this.mapPrismaConversationToConversation(conversation);
    } catch (error) {
      console.error('Get or create direct conversation failed:', error);
      throw error;
    }
  }

  // Create campaign group conversation
  async createCampaignConversation(campaignId: string, creatorId: string, participantIds: string[]): Promise<Conversation> {
    try {
      const allParticipants = [creatorId, ...participantIds.filter(id => id !== creatorId)];
      
      const conversation: any = await (this.prisma as any).conversation.create({
        data: {
          type: 'CAMPAIGN',
          campaignId,
          title: `Campaign Discussion`,
          participants: {
            create: allParticipants.map((userId, index) => ({
              userId,
              role: index === 0 ? 'ADMIN' : 'MEMBER',
              isActive: true,
              joinedAt: new Date()
            }))
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true }
              }
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      return this.mapPrismaConversationToConversation(conversation);
    } catch (error) {
      console.error('Create campaign conversation failed:', error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(
    senderId: string, 
    conversationId: string, 
    content: string, 
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'VOICE' | 'VIDEO' = 'TEXT',
    attachments?: MessageAttachment[]
  ): Promise<Message> {
    try {
      // Verify sender is participant in conversation
      const participant: any = await (this.prisma as any).conversationParticipant.findFirst({
        where: {
          conversationId,
          userId: senderId,
          isActive: true
        }
      });

      if (!participant) {
        throw new AppError('You are not a participant in this conversation', 403, 'NOT_PARTICIPANT');
      }

      const message: any = await (this.prisma as any).message.create({
        data: {
          senderId,
          conversationId,
          content,
          messageType,
          attachments: attachments || [],
          isRead: false,
          isEdited: false
        }
      });

      // Update conversation's last activity
      await (this.prisma as any).conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() }
      });

      // Update unread counts for other participants
      await this.updateUnreadCounts(conversationId, senderId);

      // Send notifications to other participants
      await this.sendMessageNotifications(conversationId, senderId, content);

      return this.mapPrismaMessageToMessage(message);
    } catch (error) {
      console.error('Send message failed:', error);
      throw error;
    }
  }

  // Get messages in a conversation
  async getMessages(
    conversationId: string, 
    userId: string, 
    page: number = 1, 
    limit: number = 50
  ): Promise<MessageThread> {
    try {
      // Verify user is participant
      const participant: any = await (this.prisma as any).conversationParticipant.findFirst({
        where: {
          conversationId,
          userId,
          isActive: true
        }
      });

      if (!participant) {
        throw new AppError('You are not a participant in this conversation', 403, 'NOT_PARTICIPANT');
      }

      const skip = (page - 1) * limit;

      const [messages, totalMessages, conversation]: any[] = await Promise.all([
        (this.prisma as any).message.findMany({
          where: { conversationId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            sender: {
              select: { id: true, name: true, avatar: true }
            }
          }
        }),
        (this.prisma as any).message.count({
          where: { conversationId }
        }),
        (this.prisma as any).conversation.findUnique({
          where: { id: conversationId },
          include: {
            participants: {
              include: {
                user: {
                  select: { id: true, name: true, avatar: true }
                }
              }
            }
          }
        })
      ]);

      // Mark messages as read
      await this.markMessagesAsRead(conversationId, userId);

      return {
        conversation: this.mapPrismaConversationToConversation(conversation),
        messages: messages.reverse().map((msg: any) => this.mapPrismaMessageToMessage(msg)),
        totalMessages,
        hasMore: skip + messages.length < totalMessages
      };
    } catch (error) {
      console.error('Get messages failed:', error);
      throw error;
    }
  }

  // Get user's conversations
  async getUserConversations(userId: string, page: number = 1, limit: number = 20): Promise<Conversation[]> {
    try {
      const skip = (page - 1) * limit;

      const conversations: any[] = await (this.prisma as any).conversation.findMany({
        where: {
          participants: {
            some: {
              userId,
              isActive: true
            }
          },
          isArchived: false
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true }
              }
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              sender: {
                select: { id: true, name: true, avatar: true }
              }
            }
          },
          _count: {
            select: {
              messages: {
                where: {
                  isRead: false,
                  senderId: { not: userId }
                }
              }
            }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      });

      return conversations.map(conv => this.mapPrismaConversationToConversation(conv));
    } catch (error) {
      console.error('Get user conversations failed:', error);
      throw error;
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await (this.prisma as any).message.updateMany({
        where: {
          conversationId,
          senderId: { not: userId },
          isRead: false
        },
        data: { isRead: true }
      });

      // Update participant's last seen
      await (this.prisma as any).conversationParticipant.updateMany({
        where: {
          conversationId,
          userId
        },
        data: { lastSeenAt: new Date() }
      });
    } catch (error) {
      console.error('Mark messages as read failed:', error);
      throw error;
    }
  }

  // Edit a message
  async editMessage(messageId: string, userId: string, newContent: string): Promise<Message> {
    try {
      const message: any = await (this.prisma as any).message.findUnique({
        where: { id: messageId }
      });

      if (!message) {
        throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
      }

      if (message.senderId !== userId) {
        throw new AppError('You can only edit your own messages', 403, 'NOT_MESSAGE_SENDER');
      }

      // Check if message is within edit time limit (e.g., 15 minutes)
      const editTimeLimit = 15 * 60 * 1000; // 15 minutes in milliseconds
      const messageAge = Date.now() - new Date(message.createdAt).getTime();
      
      if (messageAge > editTimeLimit) {
        throw new AppError('Message edit time limit exceeded', 400, 'EDIT_TIME_LIMIT_EXCEEDED');
      }

      const updatedMessage: any = await (this.prisma as any).message.update({
        where: { id: messageId },
        data: {
          content: newContent,
          isEdited: true,
          editedAt: new Date(),
          updatedAt: new Date()
        }
      });

      return this.mapPrismaMessageToMessage(updatedMessage);
    } catch (error) {
      console.error('Edit message failed:', error);
      throw error;
    }
  }

  // Delete a message
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const message: any = await (this.prisma as any).message.findUnique({
        where: { id: messageId }
      });

      if (!message) {
        throw new AppError('Message not found', 404, 'MESSAGE_NOT_FOUND');
      }

      if (message.senderId !== userId) {
        throw new AppError('You can only delete your own messages', 403, 'NOT_MESSAGE_SENDER');
      }

      await (this.prisma as any).message.delete({
        where: { id: messageId }
      });
    } catch (error) {
      console.error('Delete message failed:', error);
      throw error;
    }
  }

  // Search messages
  async searchMessages(
    userId: string, 
    query: string, 
    conversationId?: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<Message[]> {
    try {
      const skip = (page - 1) * limit;
      
      const whereClause: any = {
        content: {
          contains: query,
          mode: 'insensitive'
        },
        conversation: {
          participants: {
            some: {
              userId,
              isActive: true
            }
          }
        }
      };

      if (conversationId) {
        whereClause.conversationId = conversationId;
      }

      const messages: any[] = await (this.prisma as any).message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: { id: true, name: true, avatar: true }
          },
          conversation: {
            select: { id: true, title: true, type: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      return messages.map(msg => this.mapPrismaMessageToMessage(msg));
    } catch (error) {
      console.error('Search messages failed:', error);
      throw error;
    }
  }

  // Private helper methods
  private async updateUnreadCounts(conversationId: string, senderId: string): Promise<void> {
    // This would typically be handled by triggers or separate background process
    // For now, we'll keep it simple as the unread count is calculated on-demand
  }

  private async sendMessageNotifications(conversationId: string, senderId: string, content: string): Promise<void> {
    try {
      const participants: any[] = await (this.prisma as any).conversationParticipant.findMany({
        where: {
          conversationId,
          userId: { not: senderId },
          isActive: true
        },
        include: {
          user: { select: { id: true, name: true } }
        }
      });

      const sender: any = await (this.prisma as any).user.findUnique({
        where: { id: senderId },
        select: { name: true }
      });

      // Create notifications for participants
      const notifications = participants.map(participant => ({
        userId: participant.userId,
        type: 'NEW_MESSAGE',
        title: `New message from ${sender?.name || 'Someone'}`,
        content: content.length > 50 ? content.substring(0, 50) + '...' : content,
        isRead: false,
        metadata: {
          conversationId,
          senderId,
          senderName: sender?.name
        }
      }));

      if (notifications.length > 0) {
        await (this.prisma as any).notification.createMany({
          data: notifications
        });
      }
    } catch (error) {
      console.error('Send message notifications failed:', error);
      // Don't throw error as this is not critical
    }
  }

  // Helper methods to map Prisma objects to interfaces
  private mapPrismaMessageToMessage(prismaMessage: any): Message {
    const mapped: any = {
      id: prismaMessage.id,
      senderId: prismaMessage.senderId,
      content: prismaMessage.content,
      messageType: prismaMessage.messageType,
      isRead: prismaMessage.isRead,
      isEdited: prismaMessage.isEdited,
      createdAt: new Date(prismaMessage.createdAt),
      updatedAt: new Date(prismaMessage.updatedAt)
    };

    // Add optional fields only if they exist
    if (prismaMessage.receiverId) {
      mapped.receiverId = prismaMessage.receiverId;
    }
    if (prismaMessage.conversationId) {
      mapped.conversationId = prismaMessage.conversationId;
    }
    if (prismaMessage.attachments) {
      mapped.attachments = prismaMessage.attachments;
    }
    if (prismaMessage.editedAt) {
      mapped.editedAt = new Date(prismaMessage.editedAt);
    }

    return mapped as Message;
  }

  private mapPrismaConversationToConversation(prismaConversation: any): Conversation {
    const mapped: any = {
      id: prismaConversation.id,
      type: prismaConversation.type,
      participants: prismaConversation.participants?.map((p: any) => ({
        id: p.id,
        userId: p.userId,
        role: p.role,
        joinedAt: new Date(p.joinedAt),
        isActive: p.isActive,
        lastSeenAt: p.lastSeenAt ? new Date(p.lastSeenAt) : undefined
      })) || [],
      unreadCount: prismaConversation._count?.messages || 0,
      isArchived: prismaConversation.isArchived || false,
      createdAt: new Date(prismaConversation.createdAt),
      updatedAt: new Date(prismaConversation.updatedAt)
    };

    // Add optional fields only if they exist
    if (prismaConversation.title) {
      mapped.title = prismaConversation.title;
    }
    if (prismaConversation.description) {
      mapped.description = prismaConversation.description;
    }
    if (prismaConversation.campaignId) {
      mapped.campaignId = prismaConversation.campaignId;
    }
    if (prismaConversation.messages?.[0]) {
      mapped.lastMessage = this.mapPrismaMessageToMessage(prismaConversation.messages[0]);
    }

    return mapped as Conversation;
  }

  // Get conversation by ID
  async getConversationById(conversationId: string, userId: string): Promise<Conversation | null> {
    try {
      const conversation: any = await (this.prisma as any).conversation.findFirst({
        where: {
          id: conversationId,
          participants: {
            some: {
              userId,
              isActive: true
            }
          }
        },
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true }
              }
            }
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!conversation) {
        return null;
      }

      return this.mapPrismaConversationToConversation(conversation);
    } catch (error) {
      console.error('Get conversation by ID failed:', error);
      throw error;
    }
  }
}

export default MessagingService;
