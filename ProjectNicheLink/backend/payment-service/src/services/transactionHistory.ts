import { PrismaClient } from '@prisma/client';

export interface TransactionHistoryFilter {
  userId?: string;
  contractId?: string;
  paymentMethod?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface TransactionSummary {
  totalTransactions: number;
  totalAmount: number;
  successfulTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  averageAmount: number;
}

export class TransactionHistoryService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Lấy lịch sử giao dịch với filter
  async getTransactionHistory(filter: TransactionHistoryFilter) {
    try {
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const offset = (page - 1) * limit;

      const whereCondition: any = {};

      // Filter theo user (qua escrow contract)
      if (filter.userId) {
        whereCondition.escrowContract = {
          OR: [
            { payerId: filter.userId },
            { payeeId: filter.userId }
          ]
        };
      }

      // Filter theo contract
      if (filter.contractId) {
        whereCondition.escrowContractId = filter.contractId;
      }

      // Filter theo payment method
      if (filter.paymentMethod) {
        whereCondition.paymentMethod = filter.paymentMethod;
      }

      // Filter theo status
      if (filter.status) {
        whereCondition.status = filter.status;
      }

      // Filter theo ngày
      if (filter.startDate || filter.endDate) {
        whereCondition.createdAt = {};
        if (filter.startDate) {
          whereCondition.createdAt.gte = filter.startDate;
        }
        if (filter.endDate) {
          whereCondition.createdAt.lte = filter.endDate;
        }
      }

      const [transactions, total] = await Promise.all([
        this.prisma.payment.findMany({
          where: whereCondition,
          include: {
            escrowContract: {
              select: {
                id: true,
                contractNumber: true,
                projectTitle: true,
                payer: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true
                  }
                },
                payee: {
                  select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        this.prisma.payment.count({ where: whereCondition })
      ]);

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get transaction history failed:', error);
      throw error;
    }
  }

  // Lấy tóm tắt giao dịch
  async getTransactionSummary(filter: Omit<TransactionHistoryFilter, 'page' | 'limit'>): Promise<TransactionSummary> {
    try {
      const whereCondition: any = {};

      if (filter.userId) {
        whereCondition.escrowContract = {
          OR: [
            { payerId: filter.userId },
            { payeeId: filter.userId }
          ]
        };
      }

      if (filter.contractId) {
        whereCondition.escrowContractId = filter.contractId;
      }

      if (filter.paymentMethod) {
        whereCondition.paymentMethod = filter.paymentMethod;
      }

      if (filter.startDate || filter.endDate) {
        whereCondition.createdAt = {};
        if (filter.startDate) {
          whereCondition.createdAt.gte = filter.startDate;
        }
        if (filter.endDate) {
          whereCondition.createdAt.lte = filter.endDate;
        }
      }

      const [
        totalStats,
        successfulStats,
        pendingStats,
        failedStats
      ] = await Promise.all([
        this.prisma.payment.aggregate({
          where: whereCondition,
          _count: { id: true },
          _sum: { amount: true },
          _avg: { amount: true }
        }),
        this.prisma.payment.aggregate({
          where: { ...whereCondition, status: 'COMPLETED' },
          _count: { id: true }
        }),
        this.prisma.payment.aggregate({
          where: { ...whereCondition, status: 'PENDING' },
          _count: { id: true }
        }),
        this.prisma.payment.aggregate({
          where: { ...whereCondition, status: 'FAILED' },
          _count: { id: true }
        })
      ]);

      return {
        totalTransactions: totalStats._count.id || 0,
        totalAmount: Number(totalStats._sum.amount) || 0,
        successfulTransactions: successfulStats._count.id || 0,
        pendingTransactions: pendingStats._count.id || 0,
        failedTransactions: failedStats._count.id || 0,
        averageAmount: Number(totalStats._avg.amount) || 0
      };
    } catch (error) {
      console.error('Get transaction summary failed:', error);
      throw error;
    }
  }

  // Lấy giao dịch theo ngày (cho biểu đồ)
  async getTransactionsByDate(filter: Omit<TransactionHistoryFilter, 'page' | 'limit'>) {
    try {
      const whereCondition: any = {};

      if (filter.userId) {
        whereCondition.escrowContract = {
          OR: [
            { payerId: filter.userId },
            { payeeId: filter.userId }
          ]
        };
      }

      if (filter.contractId) {
        whereCondition.escrowContractId = filter.contractId;
      }

      if (filter.paymentMethod) {
        whereCondition.paymentMethod = filter.paymentMethod;
      }

      if (filter.startDate || filter.endDate) {
        whereCondition.createdAt = {};
        if (filter.startDate) {
          whereCondition.createdAt.gte = filter.startDate;
        }
        if (filter.endDate) {
          whereCondition.createdAt.lte = filter.endDate;
        }
      }

      const transactions = await this.prisma.payment.findMany({
        where: whereCondition,
        select: {
          id: true,
          amount: true,
          status: true,
          paymentMethod: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      // Group by date
      const groupedByDate = transactions.reduce((acc: Record<string, any>, transaction) => {
        const createdAt = transaction.createdAt;
        if (!createdAt) return acc; // Skip if no date
        
        const date = createdAt.toISOString().split('T')[0];
        if (!date) return acc; // Additional safety check
        
        if (!acc[date]) {
          acc[date] = {
            date,
            count: 0,
            amount: 0,
            successful: 0,
            pending: 0,
            failed: 0
          };
        }

        acc[date].count += 1;
        acc[date].amount += Number(transaction.amount);

        switch (transaction.status) {
          case 'COMPLETED':
            acc[date].successful += 1;
            break;
          case 'PENDING':
            acc[date].pending += 1;
            break;
          case 'FAILED':
            acc[date].failed += 1;
            break;
        }

        return acc;
      }, {});

      return Object.values(groupedByDate).sort((a: any, b: any) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    } catch (error) {
      console.error('Get transactions by date failed:', error);
      throw error;
    }
  }

  // Lấy top payment methods
  async getTopPaymentMethods(filter: Omit<TransactionHistoryFilter, 'page' | 'limit'>) {
    try {
      const whereCondition: any = {};

      if (filter.userId) {
        whereCondition.escrowContract = {
          OR: [
            { payerId: filter.userId },
            { payeeId: filter.userId }
          ]
        };
      }

      if (filter.startDate || filter.endDate) {
        whereCondition.createdAt = {};
        if (filter.startDate) {
          whereCondition.createdAt.gte = filter.startDate;
        }
        if (filter.endDate) {
          whereCondition.createdAt.lte = filter.endDate;
        }
      }

      const paymentMethods = await this.prisma.payment.groupBy({
        by: ['paymentMethod'],
        where: whereCondition,
        _count: { id: true },
        _sum: { amount: true },
        orderBy: {
          _count: {
            id: 'desc'
          }
        }
      });

      return paymentMethods.map(method => ({
        paymentMethod: method.paymentMethod,
        count: method._count.id,
        totalAmount: method._sum.amount || 0
      }));
    } catch (error) {
      console.error('Get top payment methods failed:', error);
      throw error;
    }
  }

  // Export transaction history
  async exportTransactionHistory(filter: Omit<TransactionHistoryFilter, 'page' | 'limit'>) {
    try {
      const whereCondition: any = {};

      if (filter.userId) {
        whereCondition.escrowContract = {
          OR: [
            { payerId: filter.userId },
            { payeeId: filter.userId }
          ]
        };
      }

      if (filter.contractId) {
        whereCondition.escrowContractId = filter.contractId;
      }

      if (filter.paymentMethod) {
        whereCondition.paymentMethod = filter.paymentMethod;
      }

      if (filter.status) {
        whereCondition.status = filter.status;
      }

      if (filter.startDate || filter.endDate) {
        whereCondition.createdAt = {};
        if (filter.startDate) {
          whereCondition.createdAt.gte = filter.startDate;
        }
        if (filter.endDate) {
          whereCondition.createdAt.lte = filter.endDate;
        }
      }

      const transactions = await this.prisma.payment.findMany({
        where: whereCondition,
        include: {
          escrowContract: {
            select: {
              contractNumber: true,
              projectTitle: true,
              payer: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true
                }
              },
              payee: {
                select: {
                  email: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      // Convert to CSV format
      const csvData = transactions.map(transaction => ({
        'Transaction ID': transaction.id,
        'Contract Number': transaction.escrowContract?.contractNumber || '',
        'Project Title': transaction.escrowContract?.projectTitle || '',
        'Payer': `${transaction.escrowContract?.payer?.firstName || ''} ${transaction.escrowContract?.payer?.lastName || ''}`.trim(),
        'Payee': `${transaction.escrowContract?.payee?.firstName || ''} ${transaction.escrowContract?.payee?.lastName || ''}`.trim(),
        'Amount': transaction.amount,
        'Currency': transaction.currency,
        'Payment Method': transaction.paymentMethod,
        'Status': transaction.status,
        'Created At': transaction.createdAt.toISOString(),
        'Updated At': transaction.updatedAt.toISOString()
      }));

      return csvData;
    } catch (error) {
      console.error('Export transaction history failed:', error);
      throw error;
    }
  }
}

export default TransactionHistoryService;
