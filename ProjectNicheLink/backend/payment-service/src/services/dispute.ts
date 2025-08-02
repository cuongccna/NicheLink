import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

export interface CreateDisputeParams {
  contractId: string;
  initiatorId: string;
  reason: string;
  description: string;
  evidence?: string[];
  requestedAction: 'REFUND' | 'RELEASE' | 'PARTIAL_REFUND';
  requestedAmount?: number;
}

export interface ResolveDisputeParams {
  disputeId: string;
  adminId: string;
  resolution: 'APPROVE_REFUND' | 'APPROVE_RELEASE' | 'PARTIAL_REFUND' | 'REJECT';
  adminNotes: string;
  refundAmount?: number;
}

export class DisputeService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Tạo dispute mới
  async createDispute(params: CreateDisputeParams) {
    try {
      // Kiểm tra contract tồn tại
      const contract = await this.prisma.escrowContract.findUnique({
        where: { id: params.contractId },
        include: {
          payer: true,
          payee: true
        }
      });

      if (!contract) {
        throw new AppError('Contract not found', 404, 'CONTRACT_NOT_FOUND');
      }

      // Kiểm tra người khởi tạo có quyền tạo dispute
      if (contract.payerId !== params.initiatorId && contract.payeeId !== params.initiatorId) {
        throw new AppError('Only contract parties can create disputes', 403, 'UNAUTHORIZED_DISPUTE_CREATION');
      }

      // Kiểm tra contract có đang active
      if (contract.status !== 'ACTIVE' && contract.status !== 'MILESTONE_PENDING') {
        throw new AppError('Can only create disputes for active contracts', 400, 'INVALID_CONTRACT_STATUS');
      }

      // Kiểm tra đã có dispute đang pending chưa
      const existingDispute = await this.prisma.dispute.findFirst({
        where: {
          escrowContractId: params.contractId,
          status: 'PENDING'
        }
      });

      if (existingDispute) {
        throw new AppError('There is already a pending dispute for this contract', 400, 'DISPUTE_ALREADY_EXISTS');
      }

      // Tạo dispute
      const dispute = await this.prisma.dispute.create({
        data: {
          escrowContractId: params.contractId,
          initiatorId: params.initiatorId,
          reason: params.reason,
          description: params.description,
          evidence: params.evidence || [],
          requestedAction: params.requestedAction,
          requestedAmount: params.requestedAmount || 0,
          status: 'PENDING',
          priority: this.calculatePriority(Number(contract.totalAmount)),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 ngày
        },
        include: {
          escrowContract: {
            include: {
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
          },
          initiator: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      });

      // Cập nhật trạng thái contract
      await this.prisma.escrowContract.update({
        where: { id: params.contractId },
        data: { status: 'DISPUTED' }
      });

      // Gửi notification cho các bên liên quan
      await this.sendDisputeNotifications(dispute);

      return dispute;
    } catch (error) {
      console.error('Create dispute failed:', error);
      throw error;
    }
  }

  // Lấy danh sách disputes
  async getDisputes(filter: {
    userId?: string;
    adminId?: string;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) {
    try {
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const offset = (page - 1) * limit;

      const whereCondition: any = {};

      // Filter theo user (người tham gia contract)
      if (filter.userId) {
        whereCondition.escrowContract = {
          OR: [
            { payerId: filter.userId },
            { payeeId: filter.userId }
          ]
        };
      }

      // Filter theo admin được assign
      if (filter.adminId) {
        whereCondition.assignedAdminId = filter.adminId;
      }

      // Filter theo status
      if (filter.status) {
        whereCondition.status = filter.status;
      }

      // Filter theo priority
      if (filter.priority) {
        whereCondition.priority = filter.priority;
      }

      const [disputes, total] = await Promise.all([
        this.prisma.dispute.findMany({
          where: whereCondition,
          include: {
            escrowContract: {
              include: {
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
            },
            initiator: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            },
            assignedAdmin: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: [
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          skip: offset,
          take: limit
        }),
        this.prisma.dispute.count({ where: whereCondition })
      ]);

      return {
        disputes,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Get disputes failed:', error);
      throw error;
    }
  }

  // Assign dispute cho admin
  async assignDispute(disputeId: string, adminId: string, assignedBy: string) {
    try {
      const dispute = await this.prisma.dispute.findUnique({
        where: { id: disputeId }
      });

      if (!dispute) {
        throw new AppError('Dispute not found', 404, 'DISPUTE_NOT_FOUND');
      }

      if (dispute.status !== 'PENDING') {
        throw new AppError('Can only assign pending disputes', 400, 'INVALID_DISPUTE_STATUS');
      }

      const updatedDispute = await this.prisma.dispute.update({
        where: { id: disputeId },
        data: {
          assignedAdminId: adminId,
          status: 'IN_REVIEW',
          assignedAt: new Date()
        },
        include: {
          escrowContract: {
            include: {
              payer: true,
              payee: true
            }
          },
          assignedAdmin: true
        }
      });

      return updatedDispute;
    } catch (error) {
      console.error('Assign dispute failed:', error);
      throw error;
    }
  }

  // Thêm response cho dispute
  async addDisputeResponse(disputeId: string, responderId: string, response: string, evidence?: string[]) {
    try {
      const dispute = await this.prisma.dispute.findUnique({
        where: { id: disputeId },
        include: {
          escrowContract: true
        }
      });

      if (!dispute) {
        throw new AppError('Dispute not found', 404, 'DISPUTE_NOT_FOUND');
      }

      // Kiểm tra quyền respond
      const canRespond = 
        dispute.escrowContract.payerId === responderId ||
        dispute.escrowContract.payeeId === responderId ||
        dispute.assignedAdminId === responderId;

      if (!canRespond) {
        throw new AppError('Not authorized to respond to this dispute', 403, 'UNAUTHORIZED_DISPUTE_RESPONSE');
      }

      // Tạo response
      const disputeResponse = await this.prisma.disputeResponse.create({
        data: {
          disputeId,
          responderId,
          response,
          evidence: evidence || []
        },
        include: {
          responder: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        }
      });

      return disputeResponse;
    } catch (error) {
      console.error('Add dispute response failed:', error);
      throw error;
    }
  }

  // Giải quyết dispute
  async resolveDispute(params: ResolveDisputeParams) {
    try {
      const dispute = await this.prisma.dispute.findUnique({
        where: { id: params.disputeId },
        include: {
          escrowContract: {
            include: {
              payments: true
            }
          }
        }
      });

      if (!dispute) {
        throw new AppError('Dispute not found', 404, 'DISPUTE_NOT_FOUND');
      }

      if (dispute.status !== 'IN_REVIEW') {
        throw new AppError('Can only resolve disputes in review', 400, 'INVALID_DISPUTE_STATUS');
      }

      let newContractStatus = 'ACTIVE';
      let refundAmount = 0;

      // Xử lý theo resolution
      switch (params.resolution) {
        case 'APPROVE_REFUND':
          newContractStatus = 'REFUNDED';
          refundAmount = Number(dispute.escrowContract.totalAmount);
          await this.processRefund(dispute.escrowContract.id, refundAmount);
          break;

        case 'APPROVE_RELEASE':
          newContractStatus = 'COMPLETED';
          await this.processRelease(dispute.escrowContract.id);
          break;

        case 'PARTIAL_REFUND':
          newContractStatus = 'ACTIVE';
          refundAmount = params.refundAmount || 0;
          await this.processRefund(dispute.escrowContract.id, refundAmount);
          break;

        case 'REJECT':
          newContractStatus = 'ACTIVE';
          break;
      }

      // Cập nhật dispute
      const resolvedDispute = await this.prisma.dispute.update({
        where: { id: params.disputeId },
        data: {
          status: 'RESOLVED',
          resolution: params.resolution,
          adminNotes: params.adminNotes,
          refundAmount,
          resolvedAt: new Date(),
          resolvedBy: params.adminId
        }
      });

      // Cập nhật contract
      await this.prisma.escrowContract.update({
        where: { id: dispute.escrowContractId },
        data: { status: newContractStatus as any }
      });

      // Gửi thông báo
      await this.sendResolutionNotifications(resolvedDispute);

      return resolvedDispute;
    } catch (error) {
      console.error('Resolve dispute failed:', error);
      throw error;
    }
  }

  // Tính priority của dispute
  private calculatePriority(amount: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    if (amount >= 50000000) return 'URGENT'; // >= 50M VND
    if (amount >= 10000000) return 'HIGH';   // >= 10M VND
    if (amount >= 1000000) return 'MEDIUM';  // >= 1M VND
    return 'LOW';
  }

  // Xử lý refund
  private async processRefund(contractId: string, amount: number) {
    // Implementation sẽ gọi các payment services để thực hiện refund
    console.log(`Processing refund for contract ${contractId}, amount: ${amount}`);
    
    // TODO: Implement actual refund logic for each payment method
  }

  // Xử lý release funds
  private async processRelease(contractId: string) {
    // Implementation sẽ gọi các payment services để release funds
    console.log(`Processing fund release for contract ${contractId}`);
    
    // TODO: Implement actual release logic for each payment method
  }

  // Gửi thông báo về dispute
  private async sendDisputeNotifications(dispute: any) {
    // TODO: Implement notification service
    console.log('Sending dispute notifications:', dispute.id);
  }

  // Gửi thông báo về resolution
  private async sendResolutionNotifications(dispute: any) {
    // TODO: Implement notification service
    console.log('Sending resolution notifications:', dispute.id);
  }

  // Lấy thống kê disputes
  async getDisputeStats(adminId?: string) {
    try {
      const whereCondition: any = {};
      if (adminId) {
        whereCondition.assignedAdminId = adminId;
      }

      const [
        totalDisputes,
        pendingDisputes,
        inReviewDisputes,
        resolvedDisputes,
        avgResolutionTime
      ] = await Promise.all([
        this.prisma.dispute.count({ where: whereCondition }),
        this.prisma.dispute.count({ where: { ...whereCondition, status: 'PENDING' } }),
        this.prisma.dispute.count({ where: { ...whereCondition, status: 'IN_REVIEW' } }),
        this.prisma.dispute.count({ where: { ...whereCondition, status: 'RESOLVED' } }),
        this.calculateAverageResolutionTime(whereCondition)
      ]);

      return {
        totalDisputes,
        pendingDisputes,
        inReviewDisputes,
        resolvedDisputes,
        avgResolutionTime
      };
    } catch (error) {
      console.error('Get dispute stats failed:', error);
      throw error;
    }
  }

  private async calculateAverageResolutionTime(whereCondition: any) {
    const resolvedDisputes = await this.prisma.dispute.findMany({
      where: {
        ...whereCondition,
        status: 'RESOLVED',
        resolvedAt: { not: null }
      },
      select: {
        createdAt: true,
        resolvedAt: true
      }
    });

    if (resolvedDisputes.length === 0) return 0;

    const totalTime = resolvedDisputes.reduce((sum: number, dispute: any) => {
      const resolutionTime = dispute.resolvedAt!.getTime() - dispute.createdAt.getTime();
      return sum + resolutionTime;
    }, 0);

    return Math.round(totalTime / resolvedDisputes.length / (1000 * 60 * 60 * 24)); // Trả về số ngày
  }
}

export default DisputeService;
