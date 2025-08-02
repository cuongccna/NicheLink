// Payment Service - Main Index
// Exports tất cả payment providers và services

// International Payment Providers
export { StripeService } from './stripe';
export { PayPalService } from './paypal';
export { BlockchainService } from './blockchain';

// Vietnamese Payment Providers
export { VNPayService } from './vnpay';
export { MoMoService } from './momo';

// Vietnamese Escrow Providers (Specialized for KOC Marketplace)
export { BaoKimService } from './baokim';
export { NganLuongService } from './nganluong';

// Import classes for internal use
import { BaoKimService } from './baokim';
import { NganLuongService } from './nganluong';

// Core Escrow & Transaction Services
export { EscrowService } from './escrow';
export { EscrowWalletService } from './escrowWallet';
export { TransactionHistoryService } from './transactionHistory';

// Utility Services
export { DisputeService } from './dispute';
export { AutoReleaseService } from './autoRelease';

// Type definitions for Vietnamese Escrow
export interface VietnameseEscrowConfig {
  primaryProvider: 'BAOKIM' | 'NGANLUONG';
  backupProvider: 'BAOKIM' | 'NGANLUONG';
  useBackupOn: Array<'TIMEOUT' | 'SERVICE_DOWN' | 'PAYMENT_FAILED'>;
  maxRetryAttempts: number;
  timeoutSeconds: number;
}

export interface KOCEscrowParams {
  orderId: string;
  amount: number;
  smeInfo: {
    email: string;
    name: string;
    companyName?: string;
    taxId?: string;
  };
  kocInfo: {
    email: string;
    name: string;
    socialPlatform?: string;
    followers?: number;
  };
  campaignDetails: {
    title: string;
    description: string;
    category: string;
    deliverables: string[];
    milestones: Array<{
      title: string;
      amount: number;
      dueDate: Date;
      requirements: string[];
    }>;
  };
  autoReleasePolicy: {
    enabled: boolean;
    timeoutDays: number;
    warningDays: number[];
  };
}

// Vietnamese Escrow Manager - Quản lý primary/backup providers
export class VietnameseEscrowManager {
  private primaryService: BaoKimService | NganLuongService;
  private backupService: BaoKimService | NganLuongService;
  private config: VietnameseEscrowConfig;

  constructor(
    primaryService: BaoKimService | NganLuongService,
    backupService: BaoKimService | NganLuongService,
    config: VietnameseEscrowConfig
  ) {
    this.primaryService = primaryService;
    this.backupService = backupService;
    this.config = config;
  }

  // Tạo KOC escrow với fallback logic
  async createKOCEscrow(params: KOCEscrowParams): Promise<any> {
    try {
      console.log(`Attempting KOC escrow with primary provider: ${this.config.primaryProvider}`);
      
      // Thử primary provider trước
      const primaryResult = await this.primaryService.createKOCEscrow(params);
      
      if (primaryResult.success) {
        console.log(`KOC escrow created successfully with ${this.config.primaryProvider}`);
        return {
          ...primaryResult,
          provider: this.config.primaryProvider,
          usedBackup: false
        };
      }

      // Nếu primary fail, thử backup provider
      console.log(`Primary provider failed, switching to backup: ${this.config.backupProvider}`);
      const backupResult = await this.backupService.createKOCEscrow(params);
      
      if (backupResult.success) {
        console.log(`KOC escrow created successfully with backup ${this.config.backupProvider}`);
        return {
          ...backupResult,
          provider: this.config.backupProvider,
          usedBackup: true,
          primaryError: primaryResult.message
        };
      }

      // Cả 2 provider đều fail
      throw new Error(`Both Vietnamese escrow providers failed: Primary (${primaryResult.message}), Backup (${backupResult.message})`);

    } catch (error: any) {
      console.error('Vietnamese escrow creation failed:', error);
      throw new Error(`Vietnamese escrow creation failed: ${error.message}`);
    }
  }

  // Release escrow với fallback logic
  async releaseEscrow(params: {
    escrowId: string;
    orderId: string;
    releaseAmount: number;
    releaseReason: string;
    provider: 'BAOKIM' | 'NGANLUONG';
  }): Promise<{ success: boolean; message: string; provider: string }> {
    try {
      const service = params.provider === 'BAOKIM' ? 
        (this.primaryService instanceof BaoKimService ? this.primaryService : this.backupService) :
        (this.primaryService instanceof NganLuongService ? this.primaryService : this.backupService);

      const result = await service.releaseEscrow(params);
      
      return {
        ...result,
        provider: params.provider
      };
    } catch (error: any) {
      console.error('Vietnamese escrow release failed:', error);
      return {
        success: false,
        message: `Release failed: ${error.message}`,
        provider: params.provider
      };
    }
  }

  // Refund escrow với fallback logic
  async refundEscrow(params: {
    escrowId: string;
    orderId: string;
    refundAmount: number;
    refundReason: string;
    provider: 'BAOKIM' | 'NGANLUONG';
  }): Promise<{ success: boolean; message: string; provider: string }> {
    try {
      const service = params.provider === 'BAOKIM' ? 
        (this.primaryService instanceof BaoKimService ? this.primaryService : this.backupService) :
        (this.primaryService instanceof NganLuongService ? this.primaryService : this.backupService);

      const result = await service.refundEscrow(params);
      
      return {
        ...result,
        provider: params.provider
      };
    } catch (error: any) {
      console.error('Vietnamese escrow refund failed:', error);
      return {
        success: false,
        message: `Refund failed: ${error.message}`,
        provider: params.provider
      };
    }
  }

  // Verify IPN từ bất kỳ provider nào
  async verifyIPN(data: Record<string, any>, provider: 'BAOKIM' | 'NGANLUONG'): Promise<any> {
    try {
      const service = provider === 'BAOKIM' ? 
        (this.primaryService instanceof BaoKimService ? this.primaryService : this.backupService) :
        (this.primaryService instanceof NganLuongService ? this.primaryService : this.backupService);

      return await service.verifyIPN(data);
    } catch (error: any) {
      console.error(`${provider} IPN verification failed:`, error);
      return { isValid: false, error: error.message };
    }
  }

  // Query escrow status
  async queryEscrowStatus(escrowId: string, orderId: string, provider: 'BAOKIM' | 'NGANLUONG'): Promise<any> {
    try {
      const service = provider === 'BAOKIM' ? 
        (this.primaryService instanceof BaoKimService ? this.primaryService : this.backupService) :
        (this.primaryService instanceof NganLuongService ? this.primaryService : this.backupService);

      const result = await service.queryEscrowStatus(escrowId, orderId);
      
      return {
        ...result,
        provider
      };
    } catch (error: any) {
      console.error(`${provider} escrow status query failed:`, error);
      return {
        success: false,
        message: `Status query failed: ${error.message}`,
        provider
      };
    }
  }

  // Get health status của cả 2 providers
  async getProvidersHealth(): Promise<{
    primary: { provider: string; status: 'UP' | 'DOWN' | 'UNKNOWN'; responseTime?: number };
    backup: { provider: string; status: 'UP' | 'DOWN' | 'UNKNOWN'; responseTime?: number };
  }> {
    const checkHealth = async (service: any, providerName: string) => {
      try {
        const startTime = Date.now();
        // Thử một API call đơn giản để test connectivity
        await service.queryEscrowStatus('test', 'test');
        const responseTime = Date.now() - startTime;
        
        return {
          provider: providerName,
          status: 'UP' as const,
          responseTime
        };
      } catch (error) {
        return {
          provider: providerName,
          status: 'DOWN' as const
        };
      }
    };

    const [primaryHealth, backupHealth] = await Promise.all([
      checkHealth(this.primaryService, this.config.primaryProvider),
      checkHealth(this.backupService, this.config.backupProvider)
    ]);

    return {
      primary: primaryHealth,
      backup: backupHealth
    };
  }
}

// Default configuration cho Vietnamese Escrow
export const defaultVietnameseEscrowConfig: VietnameseEscrowConfig = {
  primaryProvider: 'BAOKIM',
  backupProvider: 'NGANLUONG',
  useBackupOn: ['TIMEOUT', 'SERVICE_DOWN', 'PAYMENT_FAILED'],
  maxRetryAttempts: 3,
  timeoutSeconds: 30
};

// Factory function để tạo Vietnamese Escrow Manager
export function createVietnameseEscrowManager(
  baoKimService: BaoKimService,
  nganLuongService: NganLuongService,
  config: VietnameseEscrowConfig = defaultVietnameseEscrowConfig
): VietnameseEscrowManager {
  const primaryService = config.primaryProvider === 'BAOKIM' ? baoKimService : nganLuongService;
  const backupService = config.backupProvider === 'BAOKIM' ? baoKimService : nganLuongService;
  
  return new VietnameseEscrowManager(primaryService, backupService, config);
}
