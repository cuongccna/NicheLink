import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export interface CreateTaskParams {
  title: string;
  description?: string;
  assigneeId: string;
  dueDate?: Date;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dependencies?: string[];
  attachments?: string[];
}

export interface TaskItem {
  id: string;
  campaignId?: string;
  milestoneId?: string;
  assigneeId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dependencies: string[];
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskWorkflow {
  id: string;
  name: string;
  tasks: TaskItem[];
  completionPercentage: number;
  estimatedDuration: number;
  actualDuration?: number;
}

export interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  avgCompletionTime: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  productivityScore: number;
}

export class TaskManagementService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create a new task
  async createTask(milestoneId: string, task: CreateTaskParams): Promise<TaskItem> {
    try {
      // Get milestone information to extract campaign
      const milestone: any = await (this.prisma as any).escrowMilestone.findUnique({
        where: { id: milestoneId },
        include: { escrowContract: true }
      });

      if (!milestone) {
        throw new AppError('Milestone not found', 404, 'MILESTONE_NOT_FOUND');
      }

      const createdTask: any = await (this.prisma as any).taskItem.create({
        data: {
          milestoneId,
          campaignId: milestone.escrowContract.collaborationId, // Use collaboration as campaign reference
          assigneeId: task.assigneeId,
          title: task.title,
          description: task.description,
          dueDate: task.dueDate,
          priority: task.priority || 'MEDIUM',
          dependencies: task.dependencies || [],
          attachments: task.attachments || [],
          status: 'TODO'
        }
      });

      return this.mapPrismaTaskToTaskItem(createdTask);
    } catch (error) {
      console.error('Create task failed:', error);
      throw error;
    }
  }

  // Update task status
  async updateTaskStatus(taskId: string, status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED'): Promise<TaskItem> {
    try {
      const updatedTask: any = await (this.prisma as any).taskItem.update({
        where: { id: taskId },
        data: { 
          status,
          // Auto-set completion timestamp for completed tasks
          ...(status === 'COMPLETED' && { completedAt: new Date() })
        }
      });

      // Check if milestone can be progressed
      if (status === 'COMPLETED') {
        await this.checkMilestoneProgress(updatedTask.milestoneId);
      }

      return this.mapPrismaTaskToTaskItem(updatedTask);
    } catch (error) {
      console.error('Update task status failed:', error);
      throw error;
    }
  }

  // Get tasks by user
  async getTasksByUser(userId: string, filters?: {
    status?: string;
    priority?: string;
    campaignId?: string;
    dueDate?: Date;
  }): Promise<TaskItem[]> {
    try {
      const whereClause: any = {
        assigneeId: userId
      };

      if (filters?.status) {
        whereClause.status = filters.status;
      }

      if (filters?.priority) {
        whereClause.priority = filters.priority;
      }

      if (filters?.campaignId) {
        whereClause.campaignId = filters.campaignId;
      }

      if (filters?.dueDate) {
        whereClause.dueDate = {
          lte: filters.dueDate
        };
      }

      const tasks: any[] = await (this.prisma as any).taskItem.findMany({
        where: whereClause,
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return tasks.map(task => this.mapPrismaTaskToTaskItem(task));
    } catch (error) {
      console.error('Get tasks by user failed:', error);
      throw error;
    }
  }

  // Get tasks by milestone
  async getTasksByMilestone(milestoneId: string): Promise<TaskItem[]> {
    try {
      const tasks: any[] = await (this.prisma as any).taskItem.findMany({
        where: { milestoneId },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return tasks.map(task => this.mapPrismaTaskToTaskItem(task));
    } catch (error) {
      console.error('Get tasks by milestone failed:', error);
      throw error;
    }
  }

  // Get tasks by campaign
  async getTasksByCampaign(campaignId: string): Promise<TaskItem[]> {
    try {
      const tasks: any[] = await (this.prisma as any).taskItem.findMany({
        where: { campaignId },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' }
        ]
      });

      return tasks.map(task => this.mapPrismaTaskToTaskItem(task));
    } catch (error) {
      console.error('Get tasks by campaign failed:', error);
      throw error;
    }
  }

  // Create campaign milestone workflow
  async createCampaignMilestoneWorkflow(campaignId: string): Promise<TaskWorkflow[]> {
    try {
      // Get campaign milestones
      const campaign: any = await (this.prisma as any).campaign.findUnique({
        where: { id: campaignId },
        include: {
          contracts: {
            include: {
              escrowContract: {
                include: {
                  milestones: true
                }
              }
            }
          }
        }
      });

      if (!campaign) {
        throw new AppError('Campaign not found', 404, 'CAMPAIGN_NOT_FOUND');
      }

      const workflows: TaskWorkflow[] = [];

      for (const contract of campaign.contracts) {
        if (contract.escrowContract) {
          for (const milestone of contract.escrowContract.milestones) {
            const workflow = await this.createMilestoneWorkflow(milestone.id, milestone.title);
            workflows.push(workflow);
          }
        }
      }

      return workflows;
    } catch (error) {
      console.error('Create campaign milestone workflow failed:', error);
      throw error;
    }
  }

  // Create milestone-specific workflow
  async createMilestoneWorkflow(milestoneId: string, milestoneTitle: string): Promise<TaskWorkflow> {
    try {
      // Define standard milestone tasks based on type
      const standardTasks = await this.getStandardMilestoneTasks(milestoneId);

      const createdTasks: TaskItem[] = [];

      for (const taskTemplate of standardTasks) {
        const task = await this.createTask(milestoneId, taskTemplate);
        createdTasks.push(task);
      }

      return {
        id: milestoneId,
        name: milestoneTitle,
        tasks: createdTasks,
        completionPercentage: 0,
        estimatedDuration: this.calculateEstimatedDuration(createdTasks)
      };
    } catch (error) {
      console.error('Create milestone workflow failed:', error);
      throw error;
    }
  }

  // Get task analytics
  async getTaskAnalytics(userId?: string, campaignId?: string): Promise<TaskAnalytics> {
    try {
      const whereClause: any = {};
      
      if (userId) {
        whereClause.assigneeId = userId;
      }
      
      if (campaignId) {
        whereClause.campaignId = campaignId;
      }

      const tasks: any[] = await (this.prisma as any).taskItem.findMany({
        where: whereClause
      });

      const now = new Date();
      const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
      const overdueTasks = tasks.filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED');

      const tasksByStatus = tasks.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {});

      const tasksByPriority = tasks.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {});

      // Calculate average completion time for completed tasks
      const completionTimes = completedTasks
        .filter(t => t.completedAt)
        .map(t => new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime());
      
      const avgCompletionTime = completionTimes.length > 0
        ? completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length / (1000 * 60 * 60 * 24) // days
        : 0;

      // Calculate productivity score (0-100)
      const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
      const overdueRate = tasks.length > 0 ? (overdueTasks.length / tasks.length) * 100 : 0;
      const productivityScore = Math.max(0, completionRate - overdueRate);

      return {
        totalTasks: tasks.length,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        avgCompletionTime,
        tasksByStatus,
        tasksByPriority,
        productivityScore
      };
    } catch (error) {
      console.error('Get task analytics failed:', error);
      throw error;
    }
  }

  // Helper method to check milestone progress
  private async checkMilestoneProgress(milestoneId: string): Promise<void> {
    try {
      const tasks = await this.getTasksByMilestone(milestoneId);
      const completedTasks = tasks.filter(t => t.status === 'COMPLETED');
      
      // If all tasks are completed, mark milestone as ready for review
      if (tasks.length > 0 && completedTasks.length === tasks.length) {
        await (this.prisma as any).escrowMilestone.update({
          where: { id: milestoneId },
          data: { status: 'SUBMITTED' }
        });
        
        console.log(`Milestone ${milestoneId} marked as SUBMITTED - all tasks completed`);
      }
    } catch (error) {
      console.error('Check milestone progress failed:', error);
    }
  }

  // Helper method to get standard milestone tasks
  private async getStandardMilestoneTasks(milestoneId: string): Promise<CreateTaskParams[]> {
    // Get milestone details to determine task type
    const milestone: any = await (this.prisma as any).escrowMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        escrowContract: true
      }
    });

    const kocId = milestone.escrowContract.influencerId;
    const smeId = milestone.escrowContract.smeId;

    // Standard task templates based on milestone type
    const templates: CreateTaskParams[] = [
      {
        title: 'Review milestone requirements',
        description: 'Đọc và hiểu rõ các yêu cầu của milestone này',
        assigneeId: kocId,
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days
      },
      {
        title: 'Create content outline',
        description: 'Tạo outline chi tiết cho nội dung sẽ sản xuất',
        assigneeId: kocId,
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days
      },
      {
        title: 'Produce content',
        description: 'Sản xuất nội dung theo outline đã được phê duyệt',
        assigneeId: kocId,
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
      {
        title: 'Submit content for review',
        description: 'Gửi nội dung hoàn thiện để SME review',
        assigneeId: kocId,
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000) // 8 days
      },
      {
        title: 'Review submitted content',
        description: 'Xem xét và đánh giá nội dung được gửi',
        assigneeId: smeId,
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10 days
      }
    ];

    return templates;
  }

  // Helper method to calculate estimated duration
  private calculateEstimatedDuration(tasks: TaskItem[]): number {
    // Calculate based on priority weights
    const priorityWeights = {
      'LOW': 1,
      'MEDIUM': 2,
      'HIGH': 3,
      'URGENT': 4
    };

    const totalWeight = tasks.reduce((sum, task) => sum + priorityWeights[task.priority], 0);
    return Math.ceil(totalWeight / 2); // Rough estimate in days
  }

  // Helper method to map Prisma task to TaskItem interface
  private mapPrismaTaskToTaskItem(prismaTask: any): TaskItem {
    const mappedTask: any = {
      id: prismaTask.id,
      campaignId: prismaTask.campaignId,
      milestoneId: prismaTask.milestoneId,
      assigneeId: prismaTask.assigneeId,
      title: prismaTask.title,
      status: prismaTask.status,
      priority: prismaTask.priority,
      dependencies: prismaTask.dependencies || [],
      attachments: prismaTask.attachments || [],
      createdAt: new Date(prismaTask.createdAt),
      updatedAt: new Date(prismaTask.updatedAt)
    };

    // Only add optional fields if they exist
    if (prismaTask.description !== null && prismaTask.description !== undefined) {
      mappedTask.description = prismaTask.description;
    }

    if (prismaTask.dueDate !== null && prismaTask.dueDate !== undefined) {
      mappedTask.dueDate = new Date(prismaTask.dueDate);
    }

    return mappedTask as TaskItem;
  }

  // Delete task
  async deleteTask(taskId: string): Promise<void> {
    try {
      await (this.prisma as any).taskItem.delete({
        where: { id: taskId }
      });
    } catch (error) {
      console.error('Delete task failed:', error);
      throw error;
    }
  }

  // Update task
  async updateTask(taskId: string, updates: Partial<CreateTaskParams>): Promise<TaskItem> {
    try {
      const updatedTask: any = await (this.prisma as any).taskItem.update({
        where: { id: taskId },
        data: {
          ...updates,
          updatedAt: new Date()
        }
      });

      return this.mapPrismaTaskToTaskItem(updatedTask);
    } catch (error) {
      console.error('Update task failed:', error);
      throw error;
    }
  }
}

export default TaskManagementService;
