import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export interface WalletSummary {
  totalBalance: number;
  escrowedAmount: number;
  availableAmount: number;
  pendingReleases: number;
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  disputedContracts: number;
}

export interface ContractOverview {
  id: string;
  title: string;
  amount: number;
  status: string;
  progress: number;
  counterparty: {
    id: string;
    name: string;
    email: string;
  };
  milestonesCompleted: number;
  totalMilestones: number;
  nextMilestone?: {
    id: string;
    title: string;
    dueDate: Date;
    amount: number;
  } | undefined;
  disputes: number;
  autoReleaseScheduled: boolean;
}

export interface RecentActivity {
  id: string;
  type: 'PAYMENT' | 'MILESTONE' | 'DISPUTE' | 'RELEASE' | 'REFUND';
  description: string;
  amount?: number;
  contractId: string;
  contractTitle: string;
  timestamp: Date;
  status: string;
}

export interface PaymentBreakdown {
  method: string;
  amount: number;
  percentage: number;
  transactions: number;
}

export class EscrowWalletService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Lấy tổng quan ví escrow
  async getWalletSummary(userId: string): Promise<WalletSummary> {
    try {
      // Lấy tất cả contracts của user
      const contracts = await this.prisma.escrowContract.findMany({
        where: {
          OR: [
            { smeId: userId },
            { influencerId: userId }
          ]
        },
        include: {
          payments: true,
          milestones: true
        }
      });

      let totalBalance = 0;
      let escrowedAmount = 0;
      let pendingReleases = 0;
      let activeContracts = 0;
      let completedContracts = 0;
      let disputedContracts = 0;

      contracts.forEach((contract: any) => {
        const contractAmount = Number(contract.totalAmount);
        
        switch (contract.status) {
          case 'ACTIVE':
          case 'MILESTONE_PENDING':
            activeContracts++;
            escrowedAmount += contractAmount;
            break;
          case 'COMPLETED':
            completedContracts++;
            totalBalance += contractAmount;
            break;
          case 'DISPUTED':
            disputedContracts++;
            escrowedAmount += contractAmount;
            break;
        }

        // Tính pending releases
        const pendingMilestones = contract.milestones.filter((m: any) => 
          m.status === 'PENDING' || m.status === 'SUBMITTED'
        );
        pendingReleases += pendingMilestones.length;
      });

      const availableAmount = totalBalance - escrowedAmount;

      return {
        totalBalance,
        escrowedAmount,
        availableAmount,
        pendingReleases,
        totalContracts: contracts.length,
        activeContracts,
        completedContracts,
        disputedContracts
      };
    } catch (error) {
      console.error('Get wallet summary failed:', error);
      throw error;
    }
  }

  // Lấy danh sách contracts với overview
  async getContractOverviews(userId: string, filter?: {
    status?: string;
    role?: 'payer' | 'payee';
    page?: number;
    limit?: number;
  }): Promise<{ contracts: ContractOverview[]; pagination: any }> {
    try {
      const page = filter?.page || 1;
      const limit = filter?.limit || 20;
      const offset = (page - 1) * limit;

      const whereCondition: any = {
        OR: [
          { payerId: userId },
          { payeeId: userId }
        ]
      };

      // Filter theo role
      if (filter?.role === 'payer') {
        whereCondition.OR = [{ payerId: userId }];
      } else if (filter?.role === 'payee') {
        whereCondition.OR = [{ payeeId: userId }];
      }

      // Filter theo status
      if (filter?.status) {
        whereCondition.status = filter.status;
      }

      const [contracts, total] = await Promise.all([
        this.prisma.escrowContract.findMany({
          where: whereCondition,
          include: {
            milestones: {
              orderBy: { orderIndex: 'asc' }
            },
            disputesList: {
              where: { status: { in: ['PENDING', 'IN_REVIEW'] } }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        this.prisma.escrowContract.count({ where: whereCondition })
      ]);

      const contractOverviews = await Promise.all(
        contracts.map(async (contract: any) => {
          const isInfluencer = contract.influencerId === userId;
          
          const completedMilestones = contract.milestones.filter((m: any) => m.status === 'COMPLETED');
          const progress = contract.milestones.length > 0 
            ? (completedMilestones.length / contract.milestones.length) * 100 
            : 0;

          // Tìm milestone tiếp theo
          const nextMilestone = contract.milestones.find((m: any) => 
            m.status === 'PENDING' || m.status === 'SUBMITTED'
          );

          // Kiểm tra auto-release
          const autoReleaseScheduled = nextMilestone ? 
            await this.prisma.autoRelease.count({
              where: {
                milestoneId: nextMilestone.id,
                status: { in: ['SCHEDULED', 'WARNING_SENT'] }
              }
            }) > 0 : false;

          return {
            id: contract.id,
            title: contract.title || 'Untitled Contract',
            amount: Number(contract.totalAmount),
            status: contract.status,
            progress: Math.round(progress),
            counterparty: {
              id: isInfluencer ? contract.smeId : contract.influencerId,
              name: 'Counterparty',
              email: 'email@example.com'
            },
            milestonesCompleted: completedMilestones.length,
            totalMilestones: contract.milestones.length,
            nextMilestone: nextMilestone ? {
              id: nextMilestone.id,
              title: nextMilestone.title,
              dueDate: nextMilestone.dueDate || new Date(),
              amount: Number(nextMilestone.amount)
            } : undefined,
            disputes: contract.disputesList.length,
            autoReleaseScheduled
          };
        })
      );

      return {
        contracts: contractOverviews,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get contract overviews failed:', error);
      throw error;
    }
  }

  // Lấy hoạt động gần đây
  async getRecentActivity(userId: string, limit: number = 20): Promise<RecentActivity[]> {
    try {
      const activities: RecentActivity[] = [];

      // Lấy payments gần đây
      const recentPayments = await this.prisma.payment.findMany({
        where: {
          escrowContract: {
            OR: [
              { smeId: userId },
              { influencerId: userId }
            ]
          }
        },
        include: {
          escrowContract: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      recentPayments.forEach((payment: any) => {
        activities.push({
          id: payment.id,
          type: 'PAYMENT',
          description: `Payment ${payment.status.toLowerCase()} for "${payment.escrowContract.title}"`,
          amount: Number(payment.amount),
          contractId: payment.escrowContractId,
          contractTitle: payment.escrowContract.title,
          timestamp: payment.createdAt,
          status: payment.status
        });
      });

      // Lấy milestone activities
      const recentMilestones = await this.prisma.escrowMilestone.findMany({
        where: {
          escrowContract: {
            OR: [
              { smeId: userId },
              { influencerId: userId }
            ]
          },
          status: { in: ['COMPLETED', 'SUBMITTED', 'APPROVED'] }
        },
        include: {
          escrowContract: true
        },
        orderBy: { updatedAt: 'desc' },
        take: limit
      });

      recentMilestones.forEach((milestone: any) => {
        const actionMap: { [key: string]: string } = {
          'COMPLETED': 'completed',
          'SUBMITTED': 'submitted',
          'APPROVED': 'approved'
        };

        activities.push({
          id: milestone.id,
          type: 'MILESTONE',
          description: `Milestone "${milestone.title}" ${actionMap[milestone.status]} in "${milestone.escrowContract.title}"`,
          amount: Number(milestone.amount),
          contractId: milestone.escrowContractId,
          contractTitle: milestone.escrowContract.title,
          timestamp: milestone.updatedAt,
          status: milestone.status
        });
      });

      // Lấy disputes gần đây
      const recentDisputes = await this.prisma.dispute.findMany({
        where: {
          escrowContract: {
            OR: [
              { smeId: userId },
              { influencerId: userId }
            ]
          }
        },
        include: {
          escrowContract: true
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      recentDisputes.forEach((dispute: any) => {
        activities.push({
          id: dispute.id,
          type: 'DISPUTE',
          description: `Dispute ${dispute.status.toLowerCase()} for "${dispute.escrowContract.title}": ${dispute.reason}`,
          contractId: dispute.escrowContractId,
          contractTitle: dispute.escrowContract.title,
          timestamp: dispute.createdAt,
          status: dispute.status
        });
      });

      // Sắp xếp theo thời gian và giới hạn kết quả
      return activities
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, limit);

    } catch (error) {
      console.error('Get recent activity failed:', error);
      throw error;
    }
  }

  // Lấy chi tiết contract
  async getContractDetails(contractId: string, userId: string) {
    try {
      const contract = await this.prisma.escrowContract.findFirst({
        where: {
          id: contractId,
          OR: [
            { smeId: userId },
            { influencerId: userId }
          ]
        },
        include: {
          milestones: {
            include: {
              autoRelease: true,
              confirmations: {
                include: {
                  confirmer: {
                    select: { firstName: true, lastName: true, email: true }
                  }
                }
              }
            },
            orderBy: { orderIndex: 'asc' }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
          },
          disputesList: {
            include: {
              initiator: {
                select: { firstName: true, lastName: true, email: true }
              },
              assignedAdmin: {
                select: { firstName: true, lastName: true, email: true }
              },
              responses: {
                include: {
                  responder: {
                    select: { firstName: true, lastName: true, email: true }
                  }
                },
                orderBy: { createdAt: 'asc' }
              }
            },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!contract) {
        throw new AppError('Contract not found or access denied', 404, 'CONTRACT_NOT_FOUND');
      }

      return contract;
    } catch (error) {
      console.error('Get contract details failed:', error);
      throw error;
    }
  }

  // Lấy thống kê payment methods
  async getPaymentBreakdown(userId: string): Promise<PaymentBreakdown[]> {
    try {
      const payments = await this.prisma.payment.findMany({
        where: {
          escrowContract: {
            OR: [
              { smeId: userId },
              { influencerId: userId }
            ]
          },
          status: 'COMPLETED'
        }
      });

      const breakdown = new Map<string, { amount: number; count: number }>();
      let totalAmount = 0;

      payments.forEach((payment: any) => {
        const method = payment.paymentMethod;
        const amount = Number(payment.amount);
        
        if (!breakdown.has(method)) {
          breakdown.set(method, { amount: 0, count: 0 });
        }
        
        const current = breakdown.get(method)!;
        current.amount += amount;
        current.count += 1;
        totalAmount += amount;
      });

      return Array.from(breakdown.entries()).map(([method, data]) => ({
        method,
        amount: data.amount,
        percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
        transactions: data.count
      }));

    } catch (error) {
      console.error('Get payment breakdown failed:', error);
      throw error;
    }
  }

  // Lấy thống kê theo thời gian
  async getTimeSeriesStats(userId: string, period: 'week' | 'month' | 'quarter' = 'month') {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          break;
      }

      const [payments, contracts, disputes] = await Promise.all([
        this.prisma.payment.findMany({
          where: {
            escrowContract: {
              OR: [
                { smeId: userId },
                { influencerId: userId }
              ]
            },
            createdAt: { gte: startDate }
          },
          orderBy: { createdAt: 'asc' }
        }),
        this.prisma.escrowContract.findMany({
          where: {
            OR: [
              { smeId: userId },
              { influencerId: userId }
            ],
            createdAt: { gte: startDate }
          },
          orderBy: { createdAt: 'asc' }
        }),
        this.prisma.dispute.findMany({
          where: {
            escrowContract: {
              OR: [
                { smeId: userId },
                { influencerId: userId }
              ]
            },
            createdAt: { gte: startDate }
          },
          orderBy: { createdAt: 'asc' }
        })
      ]);

      return {
        payments: this.groupByDate(payments, 'createdAt'),
        contracts: this.groupByDate(contracts, 'createdAt'),
        disputes: this.groupByDate(disputes, 'createdAt')
      };

    } catch (error) {
      console.error('Get time series stats failed:', error);
      throw error;
    }
  }

  // Group data theo ngày
  private groupByDate(data: any[], dateField: string) {
    const grouped = new Map<string, { count: number; amount: number }>();

    data.forEach((item: any) => {
      const dateFieldValue = item[dateField];
      if (!dateFieldValue) return; // Skip if date field is null/undefined
      
      try {
        const dateValue = new Date(dateFieldValue).toISOString().split('T')[0];
        if (!dateValue) return; // Additional safety check
        
        const amount = item.amount ? Number(item.amount) : 0;

        if (!grouped.has(dateValue)) {
          grouped.set(dateValue, { count: 0, amount: 0 });
        }

        const current = grouped.get(dateValue)!;
        current.count += 1;
        current.amount += amount;
      } catch (error) {
        // Skip invalid dates
        return;
      }
    });

    return Array.from(grouped.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      amount: data.amount
    }));
  }

  // Tìm kiếm contracts
  async searchContracts(userId: string, searchTerm: string, limit: number = 10) {
    try {
      const contracts = await this.prisma.escrowContract.findMany({
        where: {
          OR: [
            { smeId: userId },
            { influencerId: userId }
          ]
        },
        take: limit
      });

      return contracts.map((contract: any) => ({
        id: contract.id,
        title: contract.title,
        amount: Number(contract.totalAmount),
        status: contract.status,
        counterparty: userId === contract.smeId ? 'Influencer' : 'SME'
      }));

    } catch (error) {
      console.error('Search contracts failed:', error);
      throw error;
    }
  }
}

export default EscrowWalletService;
