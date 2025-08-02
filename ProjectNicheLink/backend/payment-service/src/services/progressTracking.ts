import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export interface DashboardMetrics {
  overview: OverviewMetrics;
  campaigns: CampaignMetrics;
  tasks: TaskMetrics;
  content: ContentMetrics;
  financials: FinancialMetrics;
  performance: PerformanceMetrics;
  timeline: TimelineEvent[];
}

export interface OverviewMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  completedCampaigns: number;
  totalKOCs: number;
  activeKOCs: number;
  totalRevenue: number;
  pendingPayments: number;
  completionRate: number;
  averageProjectDuration: number;
}

export interface CampaignMetrics {
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  byBudgetRange: Record<string, number>;
  recentCampaigns: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
    budget: number;
    kocCount: number;
    createdAt: Date;
  }>;
  topPerforming: Array<{
    id: string;
    title: string;
    completionRate: number;
    roi: number;
    engagement: number;
  }>;
}

export interface TaskMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks: number;
  averageCompletionTime: number;
  productivityScore: number;
  tasksByPriority: Record<string, number>;
  upcomingDeadlines: Array<{
    taskId: string;
    title: string;
    dueDate: Date;
    priority: string;
    assignee: string;
  }>;
}

export interface ContentMetrics {
  totalSubmissions: number;
  approvedContent: number;
  rejectedContent: number;
  pendingReview: number;
  averageReviewTime: number;
  qualityScore: number;
  contentByPlatform: Record<string, number>;
  contentByType: Record<string, number>;
}

export interface FinancialMetrics {
  totalRevenue: number;
  totalEscrow: number;
  releasedFunds: number;
  pendingReleases: number;
  averageProjectValue: number;
  revenueGrowth: number;
  paymentsByMethod: Record<string, number>;
  monthlyRevenue: Array<{
    month: string;
    revenue: number;
    projects: number;
  }>;
}

export interface PerformanceMetrics {
  campaignSuccessRate: number;
  averageEngagementRate: number;
  kocRetentionRate: number;
  clientSatisfactionScore: number;
  platformUsageStats: Record<string, number>;
  geographicDistribution: Record<string, number>;
  timeToCompletion: {
    average: number;
    median: number;
    fastest: number;
    slowest: number;
  };
}

export interface TimelineEvent {
  id: string;
  type: 'CAMPAIGN_CREATED' | 'MILESTONE_COMPLETED' | 'CONTENT_APPROVED' | 'PAYMENT_RELEASED' | 'KOC_JOINED' | 'TASK_COMPLETED';
  title: string;
  description: string;
  entityId: string;
  entityType: 'CAMPAIGN' | 'TASK' | 'CONTENT' | 'PAYMENT' | 'USER';
  userId: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

export interface ProgressReport {
  campaignId: string;
  campaignTitle: string;
  overallProgress: number;
  milestones: Array<{
    id: string;
    title: string;
    status: string;
    progress: number;
    dueDate?: Date;
    completedAt?: Date;
    tasks: Array<{
      id: string;
      title: string;
      status: string;
      assignee: string;
      dueDate?: Date;
    }>;
  }>;
  kocProgress: Array<{
    kocId: string;
    kocName: string;
    tasksCompleted: number;
    totalTasks: number;
    contentSubmitted: number;
    contentApproved: number;
    performanceScore: number;
  }>;
  budgetUtilization: {
    totalBudget: number;
    allocated: number;
    spent: number;
    remaining: number;
    utilizationRate: number;
  };
  timeline: TimelineEvent[];
  risks: Array<{
    type: 'DELAY' | 'BUDGET' | 'QUALITY' | 'RESOURCE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    impact: string;
    mitigation: string;
  }>;
}

export interface UserDashboard {
  user: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
  metrics: DashboardMetrics;
  personalStats: {
    activeCampaigns: number;
    pendingTasks: number;
    unreadMessages: number;
    recentActivity: TimelineEvent[];
  };
  quickActions: Array<{
    id: string;
    title: string;
    description: string;
    action: string;
    priority: number;
  }>;
}

export class ProgressTrackingService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Get comprehensive dashboard metrics
  async getDashboardMetrics(userId: string, role: string): Promise<DashboardMetrics> {
    try {
      const [overview, campaigns, tasks, content, financials, performance, timeline] = await Promise.all([
        this.getOverviewMetrics(userId, role),
        this.getCampaignMetrics(userId, role),
        this.getTaskMetrics(userId, role),
        this.getContentMetrics(userId, role),
        this.getFinancialMetrics(userId, role),
        this.getPerformanceMetrics(userId, role),
        this.getTimelineEvents(userId, role)
      ]);

      return {
        overview,
        campaigns,
        tasks,
        content,
        financials,
        performance,
        timeline
      };
    } catch (error) {
      console.error('Get dashboard metrics failed:', error);
      throw error;
    }
  }

  // Get detailed progress report for a campaign
  async getCampaignProgressReport(campaignId: string, userId: string): Promise<ProgressReport> {
    try {
      // Verify user has access to campaign
      const campaign: any = await (this.prisma as any).campaign.findFirst({
        where: {
          id: campaignId,
          OR: [
            { smeId: userId },
            { contracts: { some: { kocId: userId } } }
          ]
        },
        include: {
          contracts: {
            include: {
              koc: { select: { id: true, name: true } },
              escrowContract: {
                include: {
                  milestones: {
                    include: {
                      tasks: {
                        include: {
                          assignee: { select: { id: true, name: true } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!campaign) {
        throw new AppError('Campaign not found or access denied', 404, 'CAMPAIGN_NOT_FOUND');
      }

      // Calculate overall progress
      const allMilestones = campaign.contracts.flatMap((c: any) => c.escrowContract?.milestones || []);
      const completedMilestones = allMilestones.filter((m: any) => m.status === 'COMPLETED');
      const overallProgress = allMilestones.length > 0 ? (completedMilestones.length / allMilestones.length) * 100 : 0;

      // Build milestone progress
      const milestones = allMilestones.map((milestone: any) => {
        const tasks = milestone.tasks || [];
        const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED');
        const progress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

        return {
          id: milestone.id,
          title: milestone.title,
          status: milestone.status,
          progress,
          dueDate: milestone.dueDate ? new Date(milestone.dueDate) : undefined,
          completedAt: milestone.completedAt ? new Date(milestone.completedAt) : undefined,
          tasks: tasks.map((task: any) => ({
            id: task.id,
            title: task.title,
            status: task.status,
            assignee: task.assignee?.name || 'Unassigned',
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined
          }))
        };
      });

      // Calculate KOC progress
      const kocProgress = campaign.contracts.map((contract: any) => {
        const kocTasks = allMilestones.flatMap((m: any) => 
          m.tasks?.filter((t: any) => t.assigneeId === contract.kocId) || []
        );
        const completedTasks = kocTasks.filter((t: any) => t.status === 'COMPLETED');

        // Get content submissions
        const contentSubmissions = allMilestones.flatMap((m: any) => 
          m.contentSubmissions?.filter((cs: any) => cs.submitterId === contract.kocId) || []
        );
        const approvedContent = contentSubmissions.filter((cs: any) => cs.status === 'APPROVED');

        const performanceScore = this.calculateKOCPerformanceScore(
          completedTasks.length,
          kocTasks.length,
          approvedContent.length,
          contentSubmissions.length
        );

        return {
          kocId: contract.kocId,
          kocName: contract.koc.name,
          tasksCompleted: completedTasks.length,
          totalTasks: kocTasks.length,
          contentSubmitted: contentSubmissions.length,
          contentApproved: approvedContent.length,
          performanceScore
        };
      });

      // Calculate budget utilization
      const totalBudget = campaign.budget || 0;
      const contracts = campaign.contracts.filter((c: any) => c.escrowContract);
      const allocated = contracts.reduce((sum: number, c: any) => sum + (c.escrowContract.totalAmount || 0), 0);
      const spent = contracts.reduce((sum: number, c: any) => {
        const releasedMilestones = c.escrowContract.milestones?.filter((m: any) => m.status === 'COMPLETED') || [];
        return sum + releasedMilestones.reduce((mSum: number, m: any) => mSum + (m.amount || 0), 0);
      }, 0);

      const budgetUtilization = {
        totalBudget,
        allocated,
        spent,
        remaining: totalBudget - allocated,
        utilizationRate: totalBudget > 0 ? (allocated / totalBudget) * 100 : 0
      };

      // Get timeline events
      const timeline = await this.getCampaignTimelineEvents(campaignId);

      // Identify risks
      const risks = this.identifyProjectRisks(campaign, milestones, kocProgress, budgetUtilization);

      return {
        campaignId: campaign.id,
        campaignTitle: campaign.title,
        overallProgress,
        milestones,
        kocProgress,
        budgetUtilization,
        timeline,
        risks
      };
    } catch (error) {
      console.error('Get campaign progress report failed:', error);
      throw error;
    }
  }

  // Get user-specific dashboard
  async getUserDashboard(userId: string): Promise<UserDashboard> {
    try {
      const user: any = await (this.prisma as any).user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, role: true, avatar: true }
      });

      if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
      }

      const metrics = await this.getDashboardMetrics(userId, user.role);

      // Get personal stats
      const [activeCampaigns, pendingTasks, unreadMessages, recentActivity] = await Promise.all([
        this.getUserActiveCampaigns(userId),
        this.getUserPendingTasks(userId),
        this.getUserUnreadMessages(userId),
        this.getUserRecentActivity(userId)
      ]);

      const personalStats = {
        activeCampaigns,
        pendingTasks,
        unreadMessages,
        recentActivity
      };

      // Generate quick actions based on user state
      const quickActions = this.generateQuickActions(user, personalStats);

      return {
        user,
        metrics,
        personalStats,
        quickActions
      };
    } catch (error) {
      console.error('Get user dashboard failed:', error);
      throw error;
    }
  }

  // Private helper methods for getting specific metrics
  private async getOverviewMetrics(userId: string, role: string): Promise<OverviewMetrics> {
    const whereClause = role === 'ADMIN' ? {} : 
                       role === 'SME' ? { smeId: userId } :
                       { contracts: { some: { kocId: userId } } };

    const [campaigns, kocs, payments]: any[] = await Promise.all([
      (this.prisma as any).campaign.findMany({
        where: whereClause,
        include: { contracts: true }
      }),
      (this.prisma as any).user.findMany({
        where: { role: 'KOC' }
      }),
      (this.prisma as any).escrowContract.findMany({
        where: role === 'ADMIN' ? {} : role === 'SME' ? { smeId: userId } : { influencerId: userId }
      })
    ]);

    const totalCampaigns = campaigns.length;
    const activeCampaigns = campaigns.filter((c: any) => c.status === 'ACTIVE').length;
    const completedCampaigns = campaigns.filter((c: any) => c.status === 'COMPLETED').length;
    const totalKOCs = kocs.length;
    const activeKOCs = campaigns.reduce((sum: number, c: any) => sum + c.contracts.length, 0);
    
    const totalRevenue = payments.reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0);
    const pendingPayments = payments.filter((p: any) => p.status === 'ACTIVE').length;
    const completionRate = totalCampaigns > 0 ? (completedCampaigns / totalCampaigns) * 100 : 0;

    // Calculate average project duration
    const completedCampaignsWithDates = campaigns.filter((c: any) => 
      c.status === 'COMPLETED' && c.createdAt && c.updatedAt
    );
    const averageProjectDuration = completedCampaignsWithDates.length > 0
      ? completedCampaignsWithDates.reduce((sum: number, c: any) => {
          const duration = new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime();
          return sum + (duration / (1000 * 60 * 60 * 24)); // days
        }, 0) / completedCampaignsWithDates.length
      : 0;

    return {
      totalCampaigns,
      activeCampaigns,
      completedCampaigns,
      totalKOCs,
      activeKOCs,
      totalRevenue,
      pendingPayments,
      completionRate,
      averageProjectDuration
    };
  }

  private async getCampaignMetrics(userId: string, role: string): Promise<CampaignMetrics> {
    const whereClause = role === 'ADMIN' ? {} : 
                       role === 'SME' ? { smeId: userId } :
                       { contracts: { some: { kocId: userId } } };

    const campaigns: any[] = await (this.prisma as any).campaign.findMany({
      where: whereClause,
      include: {
        contracts: { include: { escrowContract: { include: { milestones: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const byStatus = campaigns.reduce((acc: Record<string, number>, c: any) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {});

    const byCategory = campaigns.reduce((acc: Record<string, number>, c: any) => {
      (c.category || []).forEach((cat: string) => {
        acc[cat] = (acc[cat] || 0) + 1;
      });
      return acc;
    }, {});

    const byBudgetRange = campaigns.reduce((acc: Record<string, number>, c: any) => {
      const budget = c.budget || 0;
      let range = '0-10M';
      if (budget > 100000000) range = '100M+';
      else if (budget > 50000000) range = '50M-100M';
      else if (budget > 10000000) range = '10M-50M';
      
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {});

    const recentCampaigns = campaigns.slice(0, 10).map((c: any) => {
      const allMilestones = c.contracts.flatMap((contract: any) => contract.escrowContract?.milestones || []);
      const completedMilestones = allMilestones.filter((m: any) => m.status === 'COMPLETED');
      const progress = allMilestones.length > 0 ? (completedMilestones.length / allMilestones.length) * 100 : 0;

      return {
        id: c.id,
        title: c.title,
        status: c.status,
        progress,
        budget: c.budget || 0,
        kocCount: c.contracts.length,
        createdAt: new Date(c.createdAt)
      };
    });

    const topPerforming = campaigns
      .filter((c: any) => c.status === 'COMPLETED')
      .map((c: any) => ({
        id: c.id,
        title: c.title,
        completionRate: 100, // Since it's completed
        roi: Math.random() * 200 + 100, // Mock ROI calculation
        engagement: Math.random() * 10 + 5 // Mock engagement rate
      }))
      .slice(0, 5);

    return {
      byStatus,
      byCategory,
      byBudgetRange,
      recentCampaigns,
      topPerforming
    };
  }

  private async getTaskMetrics(userId: string, role: string): Promise<TaskMetrics> {
    const whereClause = role === 'ADMIN' ? {} :
                       role === 'SME' ? { milestone: { escrowContract: { smeId: userId } } } :
                       { assigneeId: userId };

    const tasks: any[] = await (this.prisma as any).taskItem.findMany({
      where: whereClause,
      include: {
        assignee: { select: { id: true, name: true } }
      }
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t: any) => t.status === 'COMPLETED').length;
    const overdueTasks = tasks.filter((t: any) => {
      if (!t.dueDate || t.status === 'COMPLETED') return false;
      return new Date(t.dueDate) < new Date();
    }).length;
    const inProgressTasks = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;

    // Calculate average completion time
    const completedTasksWithDates = tasks.filter((t: any) => 
      t.status === 'COMPLETED' && t.createdAt && t.completedAt
    );
    const averageCompletionTime = completedTasksWithDates.length > 0
      ? completedTasksWithDates.reduce((sum: number, t: any) => {
          const duration = new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime();
          return sum + (duration / (1000 * 60 * 60 * 24)); // days
        }, 0) / completedTasksWithDates.length
      : 0;

    const productivityScore = totalTasks > 0 ? 
      Math.max(0, (completedTasks / totalTasks) * 100 - (overdueTasks / totalTasks) * 50) : 0;

    const tasksByPriority = tasks.reduce((acc: Record<string, number>, t: any) => {
      acc[t.priority] = (acc[t.priority] || 0) + 1;
      return acc;
    }, {});

    const upcomingDeadlines = tasks
      .filter((t: any) => t.dueDate && t.status !== 'COMPLETED')
      .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 10)
      .map((t: any) => ({
        taskId: t.id,
        title: t.title,
        dueDate: new Date(t.dueDate),
        priority: t.priority,
        assignee: t.assignee?.name || 'Unassigned'
      }));

    return {
      totalTasks,
      completedTasks,
      overdueTasks,
      inProgressTasks,
      averageCompletionTime,
      productivityScore,
      tasksByPriority,
      upcomingDeadlines
    };
  }

  private async getContentMetrics(userId: string, role: string): Promise<ContentMetrics> {
    const whereClause = role === 'ADMIN' ? {} :
                       role === 'SME' ? { milestone: { escrowContract: { smeId: userId } } } :
                       { submitterId: userId };

    const submissions: any[] = await (this.prisma as any).contentSubmission.findMany({
      where: whereClause,
      include: {
        reviews: true
      }
    });

    const totalSubmissions = submissions.length;
    const approvedContent = submissions.filter((s: any) => s.status === 'APPROVED').length;
    const rejectedContent = submissions.filter((s: any) => s.status === 'REJECTED').length;
    const pendingReview = submissions.filter((s: any) => s.status === 'SUBMITTED').length;

    // Calculate average review time
    const reviewedSubmissions = submissions.filter((s: any) => 
      s.reviewedAt && s.submittedAt
    );
    const averageReviewTime = reviewedSubmissions.length > 0
      ? reviewedSubmissions.reduce((sum: number, s: any) => {
          const duration = new Date(s.reviewedAt).getTime() - new Date(s.submittedAt).getTime();
          return sum + (duration / (1000 * 60 * 60 * 24)); // days
        }, 0) / reviewedSubmissions.length
      : 0;

    // Calculate quality score
    const reviewsWithScores = submissions.flatMap((s: any) => s.reviews).filter((r: any) => r.overallScore);
    const qualityScore = reviewsWithScores.length > 0
      ? reviewsWithScores.reduce((sum: number, r: any) => sum + r.overallScore, 0) / reviewsWithScores.length
      : 0;

    const contentByPlatform = submissions.reduce((acc: Record<string, number>, s: any) => {
      const platform = s.content?.platform;
      if (platform) {
        acc[platform] = (acc[platform] || 0) + 1;
      }
      return acc;
    }, {});

    const contentByType = submissions.reduce((acc: Record<string, number>, s: any) => {
      const type = s.content?.contentType;
      if (type) {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    }, {});

    return {
      totalSubmissions,
      approvedContent,
      rejectedContent,
      pendingReview,
      averageReviewTime,
      qualityScore,
      contentByPlatform,
      contentByType
    };
  }

  private async getFinancialMetrics(userId: string, role: string): Promise<FinancialMetrics> {
    const whereClause = role === 'ADMIN' ? {} :
                       role === 'SME' ? { smeId: userId } :
                       { influencerId: userId };

    const escrowContracts: any[] = await (this.prisma as any).escrowContract.findMany({
      where: whereClause,
      include: {
        milestones: true,
        payments: true
      }
    });

    const totalRevenue = escrowContracts.reduce((sum: number, ec: any) => sum + (ec.totalAmount || 0), 0);
    const totalEscrow = escrowContracts
      .filter((ec: any) => ec.status === 'ACTIVE')
      .reduce((sum: number, ec: any) => sum + (ec.totalAmount || 0), 0);

    const releasedFunds = escrowContracts.reduce((sum: number, ec: any) => {
      const releasedMilestones = ec.milestones?.filter((m: any) => m.status === 'COMPLETED') || [];
      return sum + releasedMilestones.reduce((mSum: number, m: any) => mSum + (m.amount || 0), 0);
    }, 0);

    const pendingReleases = escrowContracts.reduce((sum: number, ec: any) => {
      const pendingMilestones = ec.milestones?.filter((m: any) => 
        m.status === 'SUBMITTED' || m.status === 'IN_PROGRESS'
      ) || [];
      return sum + pendingMilestones.reduce((mSum: number, m: any) => mSum + (m.amount || 0), 0);
    }, 0);

    const averageProjectValue = escrowContracts.length > 0 ? totalRevenue / escrowContracts.length : 0;

    // Mock revenue growth calculation
    const revenueGrowth = Math.random() * 50 + 10; // 10-60% growth

    const paymentsByMethod = escrowContracts.reduce((acc: Record<string, number>, ec: any) => {
      (ec.payments || []).forEach((payment: any) => {
        acc[payment.method] = (acc[payment.method] || 0) + payment.amount;
      });
      return acc;
    }, {});

    // Generate monthly revenue data (last 12 months)
    const monthlyRevenue = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return {
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: Math.random() * 100000000 + 20000000, // Mock data
        projects: Math.floor(Math.random() * 10) + 1
      };
    }).reverse();

    return {
      totalRevenue,
      totalEscrow,
      releasedFunds,
      pendingReleases,
      averageProjectValue,
      revenueGrowth,
      paymentsByMethod,
      monthlyRevenue
    };
  }

  private async getPerformanceMetrics(userId: string, role: string): Promise<PerformanceMetrics> {
    // Mock performance metrics - in real implementation, these would be calculated from actual data
    return {
      campaignSuccessRate: 85.2,
      averageEngagementRate: 4.7,
      kocRetentionRate: 78.5,
      clientSatisfactionScore: 4.3,
      platformUsageStats: {
        'Instagram': 45,
        'TikTok': 30,
        'Facebook': 15,
        'YouTube': 10
      },
      geographicDistribution: {
        'Ho Chi Minh City': 40,
        'Hanoi': 25,
        'Da Nang': 15,
        'Can Tho': 10,
        'Others': 10
      },
      timeToCompletion: {
        average: 28.5,
        median: 25,
        fastest: 12,
        slowest: 45
      }
    };
  }

  private async getTimelineEvents(userId: string, role: string, limit: number = 50): Promise<TimelineEvent[]> {
    // This would typically aggregate events from various sources
    // For now, return mock data
    const events: TimelineEvent[] = [
      {
        id: '1',
        type: 'CAMPAIGN_CREATED',
        title: 'New Campaign Created',
        description: 'Summer Fashion Collection campaign was created',
        entityId: 'campaign-1',
        entityType: 'CAMPAIGN',
        userId,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: '2',
        type: 'CONTENT_APPROVED',
        title: 'Content Approved',
        description: 'Instagram post for fashion campaign approved',
        entityId: 'content-1',
        entityType: 'CONTENT',
        userId,
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
      }
    ];

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private async getCampaignTimelineEvents(campaignId: string): Promise<TimelineEvent[]> {
    // Get events specific to a campaign
    // In real implementation, this would query various event logs
    return [];
  }

  private calculateKOCPerformanceScore(
    completedTasks: number,
    totalTasks: number,
    approvedContent: number,
    totalContent: number
  ): number {
    if (totalTasks === 0 && totalContent === 0) return 0;
    
    const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 50 : 0;
    const contentScore = totalContent > 0 ? (approvedContent / totalContent) * 50 : 0;
    
    return Math.round(taskScore + contentScore);
  }

  private identifyProjectRisks(
    campaign: any,
    milestones: any[],
    kocProgress: any[],
    budgetUtilization: any
  ): Array<{
    type: 'DELAY' | 'BUDGET' | 'QUALITY' | 'RESOURCE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    impact: string;
    mitigation: string;
  }> {
    const risks: any[] = [];

    // Check for delays
    const overdueMilestones = milestones.filter(m => 
      m.dueDate && new Date(m.dueDate) < new Date() && m.status !== 'COMPLETED'
    );
    if (overdueMilestones.length > 0) {
      risks.push({
        type: 'DELAY',
        severity: overdueMilestones.length > 2 ? 'HIGH' : 'MEDIUM',
        description: `${overdueMilestones.length} milestone(s) are overdue`,
        impact: 'Project timeline may be delayed',
        mitigation: 'Reallocate resources and adjust timeline'
      });
    }

    // Check budget utilization
    if (budgetUtilization.utilizationRate > 90) {
      risks.push({
        type: 'BUDGET',
        severity: budgetUtilization.utilizationRate > 100 ? 'CRITICAL' : 'HIGH',
        description: 'Budget utilization is very high',
        impact: 'May exceed allocated budget',
        mitigation: 'Review spending and consider budget adjustment'
      });
    }

    // Check KOC performance
    const lowPerformingKOCs = kocProgress.filter(koc => koc.performanceScore < 50);
    if (lowPerformingKOCs.length > 0) {
      risks.push({
        type: 'RESOURCE',
        severity: lowPerformingKOCs.length > 1 ? 'HIGH' : 'MEDIUM',
        description: `${lowPerformingKOCs.length} KOC(s) have low performance scores`,
        impact: 'Campaign quality and timeline may be affected',
        mitigation: 'Provide additional support or consider replacement'
      });
    }

    return risks;
  }

  // Helper methods for user dashboard
  private async getUserActiveCampaigns(userId: string): Promise<number> {
    const count = await (this.prisma as any).campaign.count({
      where: {
        OR: [
          { smeId: userId },
          { contracts: { some: { kocId: userId } } }
        ],
        status: 'ACTIVE'
      }
    });
    return count;
  }

  private async getUserPendingTasks(userId: string): Promise<number> {
    const count = await (this.prisma as any).taskItem.count({
      where: {
        assigneeId: userId,
        status: { in: ['TODO', 'IN_PROGRESS'] }
      }
    });
    return count;
  }

  private async getUserUnreadMessages(userId: string): Promise<number> {
    const count = await (this.prisma as any).message.count({
      where: {
        conversation: {
          participants: {
            some: { userId }
          }
        },
        senderId: { not: userId },
        isRead: false
      }
    });
    return count;
  }

  private async getUserRecentActivity(userId: string): Promise<TimelineEvent[]> {
    // Return recent activity for the user
    return this.getTimelineEvents(userId, 'USER', 10);
  }

  private generateQuickActions(user: any, personalStats: any): Array<{
    id: string;
    title: string;
    description: string;
    action: string;
    priority: number;
  }> {
    const actions: any[] = [];

    if (personalStats.pendingTasks > 0) {
      actions.push({
        id: 'view-tasks',
        title: 'Review Pending Tasks',
        description: `You have ${personalStats.pendingTasks} pending tasks`,
        action: '/tasks',
        priority: 1
      });
    }

    if (personalStats.unreadMessages > 0) {
      actions.push({
        id: 'check-messages',
        title: 'Check Messages',
        description: `You have ${personalStats.unreadMessages} unread messages`,
        action: '/messages',
        priority: 2
      });
    }

    if (user.role === 'SME' && personalStats.activeCampaigns === 0) {
      actions.push({
        id: 'create-campaign',
        title: 'Create New Campaign',
        description: 'Start your first campaign',
        action: '/campaigns/create',
        priority: 3
      });
    }

    return actions.sort((a, b) => a.priority - b.priority);
  }
}

export default ProgressTrackingService;
