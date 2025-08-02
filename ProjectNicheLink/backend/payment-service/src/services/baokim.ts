import crypto from 'crypto';

export interface BaoKimConfig {
  merchantId: string;
  securePass: string;
  apiUrl: string;
  escrowApiUrl: string;
  returnUrl: string;
  ipnUrl: string;
}

export interface CreateEscrowPaymentParams {
  orderId: string;
  amount: number;
  description: string;
  buyerEmail: string;
  buyerName: string;
  sellerEmail: string;
  sellerName: string;
  escrowType: 'HOLD_RELEASE' | 'HOLD_REFUND';
  releaseCondition: string;
  timeoutDays: number;
}

export interface EscrowPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  escrowId?: string;
  orderId: string;
  amount: number;
  message: string;
  errorCode?: string;
}

export interface ReleaseEscrowParams {
  escrowId: string;
  orderId: string;
  releaseAmount: number;
  releaseReason: string;
}

export interface RefundEscrowParams {
  escrowId: string;
  orderId: string;
  refundAmount: number;
  refundReason: string;
}

export class BaoKimService {
  private config: BaoKimConfig;

  constructor(config: BaoKimConfig) {
    this.config = config;
  }

  // Tạo chữ ký MD5 cho Bảo Kim
  private generateSignature(data: Record<string, any>): string {
    // Sắp xếp các key theo thứ tự alphabet
    const sortedKeys = Object.keys(data).sort();
    
    // Tạo query string
    const queryString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
    // Thêm secure pass
    const signData = queryString + this.config.securePass;
    
    // Tạo MD5 hash
    return crypto.createHash('md5').update(signData, 'utf8').digest('hex');
  }

  // Tạo giao dịch escrow (thanh toán tạm giữ)
  async createEscrowPayment(params: CreateEscrowPaymentParams): Promise<EscrowPaymentResponse> {
    try {
      const requestData = {
        merchant_id: this.config.merchantId,
        order_id: params.orderId,
        total_amount: params.amount,
        description: params.description,
        url_success: this.config.returnUrl,
        url_cancel: this.config.returnUrl,
        url_detail: this.config.ipnUrl,
        
        // Thông tin người mua
        buyer_email: params.buyerEmail,
        buyer_name: params.buyerName,
        
        // Thông tin người bán
        seller_email: params.sellerEmail,
        seller_name: params.sellerName,
        
        // Cấu hình escrow
        escrow_type: params.escrowType,
        release_condition: params.releaseCondition,
        timeout_days: params.timeoutDays,
        
        // Metadata
        created_time: Math.floor(Date.now() / 1000),
        payment_method: 'escrow'
      };

      // Tạo chữ ký
      (requestData as any).checksum = this.generateSignature(requestData);

      // Gửi request tới Bảo Kim Escrow API
      const response = await fetch(`${this.config.escrowApiUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json() as any;

      if (result.code === '0') {
        return {
          success: true,
          paymentUrl: result.data.payment_url,
          escrowId: result.data.escrow_id,
          orderId: params.orderId,
          amount: params.amount,
          message: 'Escrow payment created successfully'
        };
      } else {
        return {
          success: false,
          orderId: params.orderId,
          amount: params.amount,
          message: result.message || 'Failed to create escrow payment',
          errorCode: result.code
        };
      }
    } catch (error: any) {
      console.error('BaoKim create escrow payment failed:', error);
      return {
        success: false,
        orderId: params.orderId,
        amount: params.amount,
        message: `Error creating escrow payment: ${error.message}`
      };
    }
  }

  // Giải phóng tiền từ escrow cho người bán
  async releaseEscrow(params: ReleaseEscrowParams): Promise<{ success: boolean; message: string }> {
    try {
      const requestData = {
        merchant_id: this.config.merchantId,
        escrow_id: params.escrowId,
        order_id: params.orderId,
        release_amount: params.releaseAmount,
        release_reason: params.releaseReason,
        timestamp: Math.floor(Date.now() / 1000)
      };

      (requestData as any).checksum = this.generateSignature(requestData);

      const response = await fetch(`${this.config.escrowApiUrl}/release`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json() as any;

      if (result.code === '0') {
        return {
          success: true,
          message: 'Funds released successfully to seller'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to release escrow funds'
        };
      }
    } catch (error: any) {
      console.error('BaoKim release escrow failed:', error);
      return {
        success: false,
        message: `Error releasing escrow: ${error.message}`
      };
    }
  }

  // Hoàn tiền từ escrow cho người mua
  async refundEscrow(params: RefundEscrowParams): Promise<{ success: boolean; message: string }> {
    try {
      const requestData = {
        merchant_id: this.config.merchantId,
        escrow_id: params.escrowId,
        order_id: params.orderId,
        refund_amount: params.refundAmount,
        refund_reason: params.refundReason,
        timestamp: Math.floor(Date.now() / 1000)
      };

      (requestData as any).checksum = this.generateSignature(requestData);

      const response = await fetch(`${this.config.escrowApiUrl}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json() as any;

      if (result.code === '0') {
        return {
          success: true,
          message: 'Funds refunded successfully to buyer'
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to refund escrow funds'
        };
      }
    } catch (error: any) {
      console.error('BaoKim refund escrow failed:', error);
      return {
        success: false,
        message: `Error refunding escrow: ${error.message}`
      };
    }
  }

  // Xác thực IPN từ Bảo Kim
  async verifyIPN(data: Record<string, any>): Promise<{ isValid: boolean; transactionData?: any }> {
    try {
      const receivedChecksum = data.checksum;
      delete data.checksum;

      const expectedChecksum = this.generateSignature(data);

      if (receivedChecksum === expectedChecksum) {
        return {
          isValid: true,
          transactionData: {
            escrowId: data.escrow_id,
            orderId: data.order_id,
            amount: data.amount,
            status: data.transaction_status,
            timestamp: data.created_time,
            buyerEmail: data.buyer_email,
            sellerEmail: data.seller_email
          }
        };
      } else {
        console.error('BaoKim IPN signature mismatch:', {
          received: receivedChecksum,
          expected: expectedChecksum
        });
        return { isValid: false };
      }
    } catch (error: any) {
      console.error('BaoKim IPN verification failed:', error);
      return { isValid: false };
    }
  }

  // Truy vấn trạng thái giao dịch escrow
  async queryEscrowStatus(escrowId: string, orderId: string): Promise<any> {
    try {
      const requestData = {
        merchant_id: this.config.merchantId,
        escrow_id: escrowId,
        order_id: orderId,
        timestamp: Math.floor(Date.now() / 1000)
      };

      (requestData as any).checksum = this.generateSignature(requestData);

      const response = await fetch(`${this.config.escrowApiUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json() as any;

      if (result.code === '0') {
        return {
          success: true,
          data: {
            escrowId: result.data.escrow_id,
            orderId: result.data.order_id,
            amount: result.data.amount,
            status: result.data.status,
            createdTime: result.data.created_time,
            updatedTime: result.data.updated_time,
            buyerInfo: {
              email: result.data.buyer_email,
              name: result.data.buyer_name
            },
            sellerInfo: {
              email: result.data.seller_email,
              name: result.data.seller_name
            },
            escrowDetails: {
              type: result.data.escrow_type,
              condition: result.data.release_condition,
              timeoutDays: result.data.timeout_days
            }
          }
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to query escrow status'
        };
      }
    } catch (error: any) {
      console.error('BaoKim query escrow status failed:', error);
      return {
        success: false,
        message: `Error querying escrow status: ${error.message}`
      };
    }
  }

  // Lấy danh sách phương thức thanh toán khả dụng
  async getAvailablePaymentMethods(): Promise<any> {
    try {
      const requestData = {
        merchant_id: this.config.merchantId,
        timestamp: Math.floor(Date.now() / 1000)
      };

      (requestData as any).checksum = this.generateSignature(requestData);

      const response = await fetch(`${this.config.apiUrl}/payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json() as any;

      if (result.code === '0') {
        return {
          success: true,
          methods: result.data.methods.map((method: any) => ({
            id: method.method_id,
            name: method.method_name,
            type: method.method_type,
            fee: {
              fixed: method.fee_fixed,
              percentage: method.fee_percentage
            },
            minAmount: method.min_amount,
            maxAmount: method.max_amount,
            isEscrowSupported: method.escrow_supported || false
          }))
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to get payment methods'
        };
      }
    } catch (error: any) {
      console.error('BaoKim get payment methods failed:', error);
      return {
        success: false,
        message: `Error getting payment methods: ${error.message}`
      };
    }
  }

  // Tính phí giao dịch
  calculateFee(amount: number, paymentMethod: string = 'atm_online'): { fixedFee: number; percentageFee: number; totalFee: number } {
    // Biểu phí mẫu của Bảo Kim (cần cập nhật theo thực tế)
    const feeStructure: Record<string, { fixed: number; percentage: number }> = {
      'atm_online': { fixed: 1200, percentage: 0.011 }, // 1.1% + 1,200 VND
      'internet_banking': { fixed: 0, percentage: 0.008 }, // 0.8%
      'credit_card': { fixed: 0, percentage: 0.035 }, // 3.5%
      'e_wallet': { fixed: 0, percentage: 0.015 }, // 1.5%
      'bank_transfer': { fixed: 2000, percentage: 0.005 } // 0.5% + 2,000 VND
    };

    const fee = feeStructure[paymentMethod] || feeStructure['atm_online'];
    if (!fee) {
      return {
        fixedFee: 0,
        percentageFee: 0,
        totalFee: 0
      };
    }
    
    const percentageFee = Math.round(amount * fee.percentage);
    const totalFee = fee.fixed + percentageFee;

    return {
      fixedFee: fee.fixed,
      percentageFee,
      totalFee
    };
  }

  // Tạo escrow cho hợp tác KOC với các điều kiện đặc biệt
  async createKOCEscrow(params: {
    orderId: string;
    amount: number;
    smeInfo: { email: string; name: string; companyName?: string };
    kocInfo: { email: string; name: string; socialPlatform?: string };
    campaignDetails: {
      title: string;
      description: string;
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
  }): Promise<EscrowPaymentResponse> {
    const releaseCondition = `
KOC Campaign Escrow Agreement:
- Campaign: ${params.campaignDetails.title}
- SME: ${params.smeInfo.companyName || params.smeInfo.name}
- KOC: ${params.kocInfo.name} (${params.kocInfo.socialPlatform || 'Platform TBD'})
- Total Amount: ${params.amount.toLocaleString('vi-VN')} VND

Release Conditions:
${params.campaignDetails.milestones.map((milestone, index) => 
  `${index + 1}. ${milestone.title} - ${milestone.amount.toLocaleString('vi-VN')} VND (Due: ${milestone.dueDate.toLocaleDateString('vi-VN')})`
).join('\n')}

Auto-release: ${params.autoReleasePolicy.enabled ? `${params.autoReleasePolicy.timeoutDays} days` : 'Disabled'}
Dispute resolution: NicheLink platform arbitration
    `.trim();

    return this.createEscrowPayment({
      orderId: params.orderId,
      amount: params.amount,
      description: `KOC Campaign: ${params.campaignDetails.title}`,
      buyerEmail: params.smeInfo.email,
      buyerName: params.smeInfo.name,
      sellerEmail: params.kocInfo.email,
      sellerName: params.kocInfo.name,
      escrowType: 'HOLD_RELEASE',
      releaseCondition,
      timeoutDays: params.autoReleasePolicy.timeoutDays
    });
  }

  // Lấy danh sách ngân hàng hỗ trợ
  async getSupportedBanks(): Promise<{ success: boolean; banks?: any[]; message?: string }> {
    try {
      const requestData = {
        mrc_id: this.config.merchantId,
        txn_id: `BANK_LIST_${Date.now()}`,
        checksum: ''
      };

      // Generate checksum
      requestData.checksum = this.generateSignature(requestData);

      const response = await fetch(`${this.config.apiUrl}/bank-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json() as any;

      if (result.code === 0) {
        return {
          success: true,
          banks: result.data || []
        };
      } else {
        return {
          success: false,
          message: result.message || 'Failed to get bank list'
        };
      }
    } catch (error: any) {
      console.error('BaoKim get banks failed:', error);
      return {
        success: false,
        message: `Error getting banks: ${error.message}`
      };
    }
  }
}

export default BaoKimService;
