import { PrismaClient } from '@prisma/client';
import * as cron from 'node-cron';
import { DateTime } from 'luxon';
import { AppError } from '../middleware/errorHandler';

export interface AutoReleaseConfig {
  enabled: boolean;
  defaultTimeoutHours: number;
  warningHours: number[];
  maxRetries: number;
}

export interface MilestoneReleaseRule {
  milestoneType: string;
  timeoutHours: number;
  requiresConfirmation: boolean;
  warningHours: number[];
}

export class AutoReleaseService {
  private prisma: PrismaClient;
  private config: AutoReleaseConfig;
  private milestoneRules: MilestoneReleaseRule[];
  private isRunning: boolean = false;

  constructor(prisma: PrismaClient, config?: Partial<AutoReleaseConfig>) {
    this.prisma = prisma;
    this.config = {
      enabled: true,
      defaultTimeoutHours: 168, // 7 ngày
      warningHours: [24, 12, 2], // Cảnh báo trước 24h, 12h, 2h
      maxRetries: 3,
      ...config
    };

    this.milestoneRules = [
      {
        milestoneType: 'CONTENT_DELIVERY',
        timeoutHours: 72, // 3 ngày cho content delivery
        requiresConfirmation: true,
        warningHours: [24, 12, 2]
      },
      {
        milestoneType: 'CAMPAIGN_LAUNCH',
        timeoutHours: 168, // 7 ngày cho campaign launch
        requiresConfirmation: true,
        warningHours: [48, 24, 12]
      },
      {
        milestoneType: 'PERFORMANCE_REVIEW',
        timeoutHours: 336, // 14 ngày cho performance review
        requiresConfirmation: false,
        warningHours: [72, 24, 12]
      },
      {
        milestoneType: 'FINAL_DELIVERY',
        timeoutHours: 120, // 5 ngày cho final delivery
        requiresConfirmation: true,
        warningHours: [48, 12, 2]
      }
    ];

    this.initializeCronJobs();
  }

  // Khởi tạo cron jobs
  private initializeCronJobs() {
    if (!this.config.enabled) return;

    // Chạy mỗi giờ để kiểm tra auto-release
    cron.schedule('0 * * * *', () => {
      this.processAutoReleases();
    });

    // Chạy mỗi 30 phút để gửi warnings
    cron.schedule('*/30 * * * *', () => {
      this.processWarnings();
    });

    console.log('Auto-release cron jobs initialized');
  }

  // Tạo auto-release rule cho milestone
  async createAutoReleaseRule(milestoneId: string, customTimeoutHours?: number) {
    try {
      const milestone = await this.prisma.escrowMilestone.findUnique({
        where: { id: milestoneId },
        include: {
          escrowContract: true
        }
      });

      if (!milestone) {
        throw new AppError('Milestone not found', 404, 'MILESTONE_NOT_FOUND');
      }

      if (milestone.status !== 'PENDING') {
        throw new AppError('Can only set auto-release for pending milestones', 400, 'INVALID_MILESTONE_STATUS');
      }

      // Lấy rule theo type hoặc dùng default  
      // Note: Using 'DEFAULT' since milestone.type field might not be available in current schema
      const milestoneType = 'DEFAULT'; // TODO: Add milestone.type when schema is updated
      const rule = this.milestoneRules.find(r => r.milestoneType === milestoneType) || {
        milestoneType: 'DEFAULT',
        timeoutHours: this.config.defaultTimeoutHours,
        requiresConfirmation: true,
        warningHours: this.config.warningHours
      };

      const timeoutHours = customTimeoutHours || rule.timeoutHours;
      const releaseAt = DateTime.fromJSDate(milestone.createdAt).plus({ hours: timeoutHours }).toJSDate();

      // Tạo auto-release record
      const autoRelease = await this.prisma.autoRelease.create({
        data: {
          milestoneId,
          releaseAt,
          timeoutHours,
          requiresConfirmation: rule.requiresConfirmation,
          warningHours: rule.warningHours,
          status: 'SCHEDULED',
          retryCount: 0
        }
      });

      // Schedule warnings
      await this.scheduleWarnings(autoRelease.id, releaseAt, rule.warningHours);

      return autoRelease;
    } catch (error) {
      console.error('Create auto-release rule failed:', error);
      throw error;
    }
  }

  // Hủy auto-release rule
  async cancelAutoRelease(milestoneId: string, reason: string) {
    try {
      const autoRelease = await this.prisma.autoRelease.findFirst({
        where: {
          milestoneId,
          status: { in: ['SCHEDULED', 'WARNING_SENT'] }
        }
      });

      if (!autoRelease) {
        throw new AppError('Auto-release rule not found', 404, 'AUTO_RELEASE_NOT_FOUND');
      }

      await this.prisma.autoRelease.update({
        where: { id: autoRelease.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelReason: reason
        }
      });

      return { success: true, message: 'Auto-release cancelled' };
    } catch (error) {
      console.error('Cancel auto-release failed:', error);
      throw error;
    }
  }

  // Xử lý auto-releases đến hạn
  async processAutoReleases() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const now = new Date();
      
      // Lấy các auto-release đến hạn
      const dueReleases = await this.prisma.autoRelease.findMany({
        where: {
          releaseAt: { lte: now },
          status: { in: ['SCHEDULED', 'WARNING_SENT'] },
          retryCount: { lt: this.config.maxRetries }
        },
        include: {
          milestone: {
            include: {
              escrowContract: true
            }
          }
        }
      });

      console.log(`Processing ${dueReleases.length} auto-releases`);

      for (const autoRelease of dueReleases) {
        try {
          await this.executeAutoRelease(autoRelease);
        } catch (error) {
          console.error(`Auto-release failed for milestone ${autoRelease.milestoneId}:`, error);
          await this.handleAutoReleaseError(autoRelease.id, error);
        }
      }
    } catch (error) {
      console.error('Process auto-releases failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Thực hiện auto-release
  private async executeAutoRelease(autoRelease: any) {
    const milestone = autoRelease.milestone;
    
    // Kiểm tra milestone vẫn có thể release
    if (milestone.status !== 'PENDING') {
      await this.prisma.autoRelease.update({
        where: { id: autoRelease.id },
        data: {
          status: 'CANCELLED',
          cancelReason: 'Milestone status changed'
        }
      });
      return;
    }

    // Kiểm tra có require confirmation không
    if (autoRelease.requiresConfirmation) {
      // Kiểm tra có confirmation từ payer chưa
      const confirmation = await this.prisma.releaseConfirmation.findFirst({
        where: {
          milestoneId: milestone.id,
          confirmedAt: { gte: autoRelease.releaseAt }
        }
      });

      if (!confirmation) {
        // Gửi notification yêu cầu confirmation
        await this.sendConfirmationRequest(autoRelease);
        
        // Gia hạn thêm 24h
        await this.prisma.autoRelease.update({
          where: { id: autoRelease.id },
          data: {
            releaseAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'WAITING_CONFIRMATION'
          }
        });
        return;
      }
    }

    // Thực hiện release
    await this.releaseMilestoneFunds(milestone.id);

    // Cập nhật auto-release status
    await this.prisma.autoRelease.update({
      where: { id: autoRelease.id },
      data: {
        status: 'EXECUTED',
        executedAt: new Date()
      }
    });

    // Gửi notification
    await this.sendReleaseNotification(autoRelease);
  }

  // Release funds cho milestone
  private async releaseMilestoneFunds(milestoneId: string) {
    try {
      const milestone = await this.prisma.escrowMilestone.findUnique({
        where: { id: milestoneId },
        include: {
          escrowContract: {
            include: {
              payments: true
            }
          }
        }
      });

      if (!milestone) {
        throw new AppError('Milestone not found', 404, 'MILESTONE_NOT_FOUND');
      }

      // Cập nhật milestone status
      await this.prisma.escrowMilestone.update({
        where: { id: milestoneId },
        data: {
          status: 'COMPLETED'
        }
      });

      // TODO: Implement actual fund release logic
      // Sẽ gọi các payment services để release funds
      console.log(`Released funds for milestone ${milestoneId}, amount: ${milestone.amount}`);

      // Kiểm tra nếu tất cả milestones hoàn thành thì complete contract
      const remainingMilestones = await this.prisma.escrowMilestone.count({
        where: {
          escrowContractId: milestone.escrowContractId,
          status: { not: 'COMPLETED' }
        }
      });

      if (remainingMilestones === 0) {
        await this.prisma.escrowContract.update({
          where: { id: milestone.escrowContractId },
          data: { status: 'COMPLETED' }
        });
      }

    } catch (error) {
      console.error('Release milestone funds failed:', error);
      throw error;
    }
  }

  // Xử lý warnings
  async processWarnings() {
    try {
      const now = DateTime.now();

      const upcomingReleases = await this.prisma.autoRelease.findMany({
        where: {
          status: { in: ['SCHEDULED', 'WARNING_SENT'] },
          releaseAt: { gt: now.toJSDate() }
        },
        include: {
          milestone: {
            include: {
              escrowContract: true
            }
          }
        }
      });

      for (const autoRelease of upcomingReleases) {
        const releaseTime = DateTime.fromJSDate(autoRelease.releaseAt);
        const hoursUntilRelease = releaseTime.diff(now, 'hours').hours;

        // Kiểm tra có warning hour nào match không
        const warningHour = autoRelease.warningHours.find((hour: number) => 
          Math.abs(hoursUntilRelease - hour) < 0.5 // Trong vòng 30 phút
        );

        if (warningHour) {
          await this.sendWarningNotification(autoRelease, warningHour);
          
          // Cập nhật status
          await this.prisma.autoRelease.update({
            where: { id: autoRelease.id },
            data: { status: 'WARNING_SENT' }
          });
        }
      }
    } catch (error) {
      console.error('Process warnings failed:', error);
    }
  }

  // Schedule warnings cho auto-release
  private async scheduleWarnings(autoReleaseId: string, releaseAt: Date, warningHours: number[]) {
    // Warning hours sẽ được xử lý trong processWarnings
    console.log(`Scheduled warnings for auto-release ${autoReleaseId} at ${releaseAt}`);
  }

  // Xử lý lỗi auto-release
  private async handleAutoReleaseError(autoReleaseId: string, error: any) {
    try {
      const autoRelease = await this.prisma.autoRelease.findUnique({
        where: { id: autoReleaseId }
      });

      if (!autoRelease) return;

      const retryCount = autoRelease.retryCount + 1;

      if (retryCount >= this.config.maxRetries) {
        // Quá số lần retry, mark as failed
        await this.prisma.autoRelease.update({
          where: { id: autoReleaseId },
          data: {
            status: 'FAILED',
            retryCount,
            lastError: error.message
          }
        });

        // Gửi notification cho admin
        await this.sendFailureNotification(autoReleaseId, error);
      } else {
        // Retry sau 1 giờ
        await this.prisma.autoRelease.update({
          where: { id: autoReleaseId },
          data: {
            retryCount,
            releaseAt: new Date(Date.now() + 60 * 60 * 1000),
            lastError: error.message
          }
        });
      }
    } catch (updateError) {
      console.error('Handle auto-release error failed:', updateError);
    }
  }

  // Gửi confirmation request
  private async sendConfirmationRequest(autoRelease: any) {
    // TODO: Implement notification service
    console.log('Sending confirmation request:', autoRelease.id);
  }

  // Gửi warning notification
  private async sendWarningNotification(autoRelease: any, warningHour: number) {
    // TODO: Implement notification service
    console.log(`Sending warning notification: ${warningHour}h before release`);
  }

  // Gửi release notification
  private async sendReleaseNotification(autoRelease: any) {
    // TODO: Implement notification service
    console.log('Sending release notification:', autoRelease.id);
  }

  // Gửi failure notification
  private async sendFailureNotification(autoReleaseId: string, error: any) {
    // TODO: Implement notification service
    console.log('Sending failure notification:', autoReleaseId);
  }

  // Lấy thống kê auto-release
  async getAutoReleaseStats() {
    try {
      const [
        totalScheduled,
        executed,
        cancelled,
        failed,
        upcomingReleases
      ] = await Promise.all([
        this.prisma.autoRelease.count({ where: { status: 'SCHEDULED' } }),
        this.prisma.autoRelease.count({ where: { status: 'EXECUTED' } }),
        this.prisma.autoRelease.count({ where: { status: 'CANCELLED' } }),
        this.prisma.autoRelease.count({ where: { status: 'FAILED' } }),
        this.prisma.autoRelease.count({
          where: {
            status: { in: ['SCHEDULED', 'WARNING_SENT'] },
            releaseAt: { gte: new Date() }
          }
        })
      ]);

      return {
        totalScheduled,
        executed,
        cancelled,
        failed,
        upcomingReleases
      };
    } catch (error) {
      console.error('Get auto-release stats failed:', error);
      throw error;
    }
  }

  // Cập nhật config
  updateConfig(newConfig: Partial<AutoReleaseConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  // Dừng auto-release service
  stop() {
    this.config.enabled = false;
    console.log('Auto-release service stopped');
  }
}

export default AutoReleaseService;
