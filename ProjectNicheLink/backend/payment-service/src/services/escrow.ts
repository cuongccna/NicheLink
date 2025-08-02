import { PrismaClient, EscrowStatus, PaymentMethod, ReleaseStatus } from '@prisma/client';
import StripeService from './stripe';
import PayPalService from './paypal';
import BlockchainService from './blockchain';
import { AppError } from '../middleware/errorHandler';

export interface CreateEscrowContractParams {
  payerId: string;
  payeeId: string;
  projectTitle: string;
  projectDescription: string;
  totalAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  collaborationId?: string;
  milestones: Array<{
    title: string;
    description: string;
    amount: number;
    dueDate: Date;
    deliverables: string[];
  }>;
  terms: string;
  autoReleaseEnabled?: boolean;
  autoReleaseDays?: number;
}

export interface EscrowContractDetails {
  id: string;
  contractNumber: string;
  payer: any;
  payee: any;
  projectTitle: string;
  projectDescription: string;
  totalAmount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: EscrowStatus;
  milestones: any[];
  createdAt: Date;
  updatedAt: Date;
}

export class EscrowService {
  private prisma: PrismaClient;
  private stripeService: StripeService;
  private paypalService: PayPalService;
  private blockchainService: BlockchainService;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.stripeService = new StripeService();
    this.paypalService = new PayPalService();
    this.blockchainService = new BlockchainService();
  }

  // Generate unique contract number
  private generateContractNumber(): string {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `ESC-${timestamp}-${random}`;
  }

  // Create escrow contract
  async createEscrowContract(params: CreateEscrowContractParams): Promise<EscrowContractDetails> {
    try {
      const contractNumber = this.generateContractNumber();

      // Validate users exist
      const [payer, payee] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: params.payerId } }),
        this.prisma.user.findUnique({ where: { id: params.payeeId } })
      ]);

      if (!payer) {
        throw new AppError('Payer not found', 404, 'PAYER_NOT_FOUND');
      }
      if (!payee) {
        throw new AppError('Payee not found', 404, 'PAYEE_NOT_FOUND');
      }

      // Create escrow contract with milestones
      const escrowContract = await this.prisma.escrowContract.create({
        data: {
          collaborationId: params.collaborationId || 'default-collaboration',
          smeId: params.payerId || '', // Assuming payer is SME
          influencerId: params.payeeId || '', // Assuming payee is Influencer
          projectTitle: params.projectTitle,
          description: params.projectDescription,
          totalAmount: params.totalAmount,
          currency: params.currency,
          paymentMethod: params.paymentMethod,
          status: EscrowStatus.CREATED,
          platformFee: 0, // Default platform fee
          milestones: {
            create: params.milestones.map((milestone, index) => ({
              title: milestone.title,
              description: milestone.description,
              amount: milestone.amount,
              percentage: (milestone.amount / params.totalAmount) * 100,
              dueDate: milestone.dueDate,
              orderIndex: index,
              status: 'PENDING'
            }))
          }
        },
        include: {
          milestones: true
        }
      });

      return this.formatEscrowContractDetails(escrowContract);
    } catch (error) {
      console.error('Create escrow contract failed:', error);
      throw error;
    }
  }

  // Get escrow contract by ID
  async getEscrowContract(contractId: string): Promise<EscrowContractDetails> {
    try {
      const contract = await this.prisma.escrowContract.findUnique({
        where: { id: contractId },
        include: {
          milestones: {
            orderBy: { orderIndex: 'asc' }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!contract) {
        throw new AppError('Escrow contract not found', 404, 'CONTRACT_NOT_FOUND');
      }

      return this.formatEscrowContractDetails(contract);
    } catch (error) {
      console.error('Get escrow contract failed:', error);
      throw error;
    }
  }

  // Initiate payment for escrow contract
  async initiatePayment(contractId: string, userId: string): Promise<any> {
    try {
      const contract = await this.getEscrowContract(contractId);

      // Verify user is the payer
      if (contract.payer.id !== userId) {
        throw new AppError('Only the payer can initiate payment', 403, 'UNAUTHORIZED_PAYMENT');
      }

      // Verify contract is in correct status
      if (contract.status !== EscrowStatus.CREATED && contract.status !== EscrowStatus.FUNDED) {
        throw new AppError('Contract is not in a state to accept payment', 400, 'INVALID_CONTRACT_STATUS');
      }

      let paymentResult;

      switch (contract.paymentMethod) {
        case PaymentMethod.STRIPE_CARD:
          paymentResult = await this.initiateStripePayment(contract);
          break;
        case PaymentMethod.PAYPAL:
          paymentResult = await this.initiatePayPalPayment(contract);
          break;
        case PaymentMethod.CRYPTO_ETH:
          paymentResult = await this.initiateCryptoPayment(contract);
          break;
        default:
          throw new AppError('Unsupported payment method', 400, 'UNSUPPORTED_PAYMENT_METHOD');
      }

      // Update contract status
      await this.prisma.escrowContract.update({
        where: { id: contractId },
        data: { status: EscrowStatus.FUNDED }
      });

      return paymentResult;
    } catch (error) {
      console.error('Initiate payment failed:', error);
      throw error;
    }
  }

  // Stripe payment initiation
  private async initiateStripePayment(contract: EscrowContractDetails): Promise<any> {
    try {
      const paymentIntent = await this.stripeService.holdFunds(
        contract.totalAmount,
        contract.currency,
        contract.payer.id,
        `Escrow for project: ${contract.projectTitle}`
      );

      // Save payment record
      await this.prisma.payment.create({
        data: {
          escrowContractId: contract.id,
          paymentMethod: PaymentMethod.STRIPE_CARD,
          amount: contract.totalAmount,
          currency: contract.currency,
          status: 'PENDING',
          description: `Payment for escrow contract ${contract.id}`,
          reference: `stripe_${paymentIntent.id}`
        }
      });

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
      };
    } catch (error) {
      console.error('Stripe payment initiation failed:', error);
      throw error;
    }
  }

  // PayPal payment initiation
  private async initiatePayPalPayment(contract: EscrowContractDetails): Promise<any> {
    try {
      const order = await this.paypalService.holdFunds(
        contract.totalAmount.toString(),
        contract.currency,
        `Escrow for project: ${contract.projectTitle}`,
        contract.contractNumber
      );

      // Save payment record
      await this.prisma.payment.create({
        data: {
          escrowContractId: contract.id,
          paymentMethod: PaymentMethod.PAYPAL,
          amount: contract.totalAmount,
          currency: contract.currency,
          status: 'PENDING',
          description: `PayPal payment for escrow contract ${contract.id}`,
          reference: `paypal_${order.id}`
        }
      });

      return {
        orderId: order.id,
        approvalUrl: order.links.find((link: any) => link.rel === 'approve')?.href
      };
    } catch (error) {
      console.error('PayPal payment initiation failed:', error);
      throw error;
    }
  }

  // Crypto payment initiation
  private async initiateCryptoPayment(contract: EscrowContractDetails): Promise<any> {
    try {
      // Generate escrow wallet for this contract
      const escrowWallet = await this.blockchainService.generateWallet();

      // Save payment record
      await this.prisma.payment.create({
        data: {
          escrowContractId: contract.id,
          paymentMethod: PaymentMethod.CRYPTO_ETH,
          amount: contract.totalAmount,
          currency: contract.currency,
          status: 'PENDING',
          description: `Crypto payment for escrow contract ${contract.id}`,
          reference: `crypto_${escrowWallet.address}`
        }
      });

      return {
        escrowAddress: escrowWallet.address,
        amount: contract.totalAmount,
        currency: contract.currency,
        qrCode: `ethereum:${escrowWallet.address}?value=${contract.totalAmount}`
      };
    } catch (error) {
      console.error('Crypto payment initiation failed:', error);
      throw error;
    }
  }

  // Confirm payment received
  async confirmPayment(contractId: string, paymentData: any): Promise<void> {
    try {
      const contract = await this.getEscrowContract(contractId);

      switch (contract.paymentMethod) {
        case PaymentMethod.STRIPE_CARD:
          await this.confirmStripePayment(contract, paymentData);
          break;
        case PaymentMethod.PAYPAL:
          await this.confirmPayPalPayment(contract, paymentData);
          break;
        case PaymentMethod.CRYPTO_ETH:
          await this.confirmCryptoPayment(contract, paymentData);
          break;
      }

      // Update contract status to active
      await this.prisma.escrowContract.update({
        where: { id: contractId },
        data: { 
          status: EscrowStatus.ACTIVE
        }
      });

      // Update all milestones to pending
      await this.prisma.escrowMilestone.updateMany({
        where: { escrowContractId: contractId },
        data: { status: 'PENDING' }
      });
    } catch (error) {
      console.error('Confirm payment failed:', error);
      throw error;
    }
  }

  // Milestone completion and approval
  async completeMilestone(contractId: string, milestoneId: string, userId: string, deliverableUrls: string[]): Promise<void> {
    try {
      const contract = await this.getEscrowContract(contractId);

      // Verify user is the payee
      if (contract.payee.id !== userId) {
        throw new AppError('Only the payee can complete milestones', 403, 'UNAUTHORIZED_MILESTONE_COMPLETION');
      }

      const milestone = await this.prisma.escrowMilestone.findUnique({
        where: { id: milestoneId }
      });

      if (!milestone || milestone.escrowContractId !== contractId) {
        throw new AppError('Milestone not found', 404, 'MILESTONE_NOT_FOUND');
      }

      if (milestone.status !== 'PENDING') {
        throw new AppError('Milestone is not in pending status', 400, 'INVALID_MILESTONE_STATUS');
      }

      // Update milestone status
      await this.prisma.escrowMilestone.update({
        where: { id: milestoneId },
        data: {
          status: 'COMPLETED'
        }
      });
    } catch (error) {
      console.error('Complete milestone failed:', error);
      throw error;
    }
  }

  async approveMilestone(contractId: string, milestoneId: string, userId: string): Promise<void> {
    try {
      const contract = await this.getEscrowContract(contractId);

      // Verify user is the payer
      if (contract.payer.id !== userId) {
        throw new AppError('Only the payer can approve milestones', 403, 'UNAUTHORIZED_MILESTONE_APPROVAL');
      }

      const milestone = await this.prisma.escrowMilestone.findUnique({
        where: { id: milestoneId }
      });

      if (!milestone || milestone.escrowContractId !== contractId) {
        throw new AppError('Milestone not found', 404, 'MILESTONE_NOT_FOUND');
      }

      if (milestone.status !== 'COMPLETED') {
        throw new AppError('Milestone is not completed yet', 400, 'INVALID_MILESTONE_STATUS');
      }

      // Update milestone status
      await this.prisma.escrowMilestone.update({
        where: { id: milestoneId },
        data: {
          status: 'APPROVED'
        }
      });

      // Release funds for this milestone
      await this.releaseMilestoneFunds(contractId, milestoneId);
    } catch (error) {
      console.error('Approve milestone failed:', error);
      throw error;
    }
  }

  // Release funds for approved milestone
  private async releaseMilestoneFunds(contractId: string, milestoneId: string): Promise<void> {
    try {
      const milestone = await this.prisma.escrowMilestone.findUnique({
        where: { id: milestoneId },
        include: { escrowContract: true }
      });

      if (!milestone) {
        throw new AppError('Milestone not found', 404, 'MILESTONE_NOT_FOUND');
      }

      // Create fund release record
      const fundRelease = await this.prisma.fundRelease.create({
        data: {
          escrowContractId: contractId,
          milestoneId: milestoneId,
          recipientId: milestone.escrowContract.influencerId || '',
          amount: milestone.amount,
          status: ReleaseStatus.PENDING,
          releaseReason: 'MILESTONE_COMPLETED',
          initiatedBy: 'SYSTEM',
          scheduledFor: new Date()
        }
      });

      // Process the actual fund release based on payment method
      switch (milestone.escrowContract.paymentMethod) {
        case PaymentMethod.STRIPE_CARD:
          await this.releaseStripeTransfer(fundRelease.id, milestone);
          break;
        case PaymentMethod.PAYPAL:
          await this.releasePayPalPayout(fundRelease.id, milestone);
          break;
        case PaymentMethod.CRYPTO_ETH:
          await this.releaseCryptoTransfer(fundRelease.id, milestone);
          break;
      }
    } catch (error) {
      console.error('Release milestone funds failed:', error);
      throw error;
    }
  }

  // Format escrow contract details for response
  private formatEscrowContractDetails(contract: any): EscrowContractDetails {
    return {
      id: contract.id,
      contractNumber: contract.contractNumber,
      payer: contract.payer,
      payee: contract.payee,
      projectTitle: contract.projectTitle,
      projectDescription: contract.projectDescription,
      totalAmount: contract.totalAmount,
      currency: contract.currency,
      paymentMethod: contract.paymentMethod,
      status: contract.status,
      milestones: contract.milestones || [],
      createdAt: contract.createdAt,
      updatedAt: contract.updatedAt
    };
  }

  // Additional helper methods for payment confirmations and fund releases
  private async confirmStripePayment(contract: EscrowContractDetails, paymentData: any): Promise<void> {
    // Implementation for confirming Stripe payment
  }

  private async confirmPayPalPayment(contract: EscrowContractDetails, paymentData: any): Promise<void> {
    // Implementation for confirming PayPal payment
  }

  private async confirmCryptoPayment(contract: EscrowContractDetails, paymentData: any): Promise<void> {
    // Implementation for confirming crypto payment
  }

  private async releaseStripeTransfer(fundReleaseId: string, milestone: any): Promise<void> {
    // Implementation for Stripe fund release
  }

  private async releasePayPalPayout(fundReleaseId: string, milestone: any): Promise<void> {
    // Implementation for PayPal fund release
  }

  private async releaseCryptoTransfer(fundReleaseId: string, milestone: any): Promise<void> {
    // Implementation for crypto fund release
  }
}

export default EscrowService;
