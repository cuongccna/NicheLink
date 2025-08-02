import crypto from 'crypto';

export interface NganLuongConfig {
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

export class NganLuongService {
  private config: NganLuongConfig;

  constructor(config: NganLuongConfig) {
    this.config = config;
  }

  // Tạo chữ ký MD5 cho Ngân Lượng
  private generateSignature(data: Record<string, any>): string {
    // Sắp xếp các key theo thứ tự alphabet
    const sortedKeys = Object.keys(data).sort();
    
    // Tạo query string
    const queryString = sortedKeys
      .filter(key => data[key] !== null && data[key] !== undefined && data[key] !== '')
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
        function: 'SetExpressCheckout',
        version: '3.1',
        merchant_id: this.config.merchantId,
        receiver_email: this.config.merchantId,
        merchant_password: this.config.securePass,
        order_code: params.orderId,
        total_amount: params.amount,
        payment_method: 'NL',
        bank_code: '',
        payment_type: '2', // Thanh toán tạm giữ
        order_description: params.description,
        tax_amount: '0',
        fee_shipping: '0',
        discount_amount: '0',
        return_url: this.config.returnUrl,
        cancel_url: this.config.returnUrl,
        notify_url: this.config.ipnUrl,
        
        // Thông tin người mua
        buyer_fullname: params.buyerName,
        buyer_email: params.buyerEmail,
        buyer_mobile: '',
        buyer_address: '',
        
        // Thông tin người bán  
        seller_fullname: params.sellerName,
        seller_email: params.sellerEmail,
        
        // Cấu hình escrow
        escrow_detail: params.releaseCondition,
        timeout_days: params.timeoutDays.toString(),
        cur_code: 'vnd',
        lang_code: 'vi'
      };

      // Gửi request tới Ngân Lượng Escrow API
      const response = await fetch(`${this.config.escrowApiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestData as any).toString()
      });

      const responseText = await response.text();
      
      // Parse response (Ngân Lượng trả về format đặc biệt)
      const result = this.parseNganLuongResponse(responseText);

      if (result.error_code === '00') {
        return {
          success: true,
          paymentUrl: result.checkout_url,
          escrowId: result.token,
          orderId: params.orderId,
          amount: params.amount,
          message: 'Escrow payment created successfully'
        };
      } else {
        return {
          success: false,
          orderId: params.orderId,
          amount: params.amount,
          message: result.description || 'Failed to create escrow payment',
          errorCode: result.error_code
        };
      }
    } catch (error: any) {
      console.error('NganLuong create escrow payment failed:', error);
      return {
        success: false,
        orderId: params.orderId,
        amount: params.amount,
        message: `Error creating escrow payment: ${error.message}`
      };
    }
  }

  // Parse response từ Ngân Lượng (format đặc biệt)
  private parseNganLuongResponse(responseText: string): any {
    const lines = responseText.trim().split('\n');
    const result: any = {};
    
    for (const line of lines) {
      const [key, value] = line.split('=');
      if (key && value) {
        result[key] = value;
      }
    }
    
    return result;
  }

  // Giải phóng tiền từ escrow cho người bán
  async releaseEscrow(params: {
    escrowId: string;
    orderId: string;
    releaseAmount: number;
    releaseReason: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const requestData = {
        function: 'EscrowRelease',
        version: '3.1',
        merchant_id: this.config.merchantId,
        merchant_password: this.config.securePass,
        token: params.escrowId,
        order_code: params.orderId,
        release_amount: params.releaseAmount,
        release_note: params.releaseReason
      };

      const response = await fetch(`${this.config.escrowApiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestData as any).toString()
      });

      const responseText = await response.text();
      const result = this.parseNganLuongResponse(responseText);

      if (result.error_code === '00') {
        return {
          success: true,
          message: 'Funds released successfully to seller'
        };
      } else {
        return {
          success: false,
          message: result.description || 'Failed to release escrow funds'
        };
      }
    } catch (error: any) {
      console.error('NganLuong release escrow failed:', error);
      return {
        success: false,
        message: `Error releasing escrow: ${error.message}`
      };
    }
  }

  // Hoàn tiền từ escrow cho người mua
  async refundEscrow(params: {
    escrowId: string;
    orderId: string;
    refundAmount: number;
    refundReason: string;
  }): Promise<{ success: boolean; message: string }> {
    try {
      const requestData = {
        function: 'EscrowRefund',
        version: '3.1',
        merchant_id: this.config.merchantId,
        merchant_password: this.config.securePass,
        token: params.escrowId,
        order_code: params.orderId,
        refund_amount: params.refundAmount,
        refund_note: params.refundReason
      };

      const response = await fetch(`${this.config.escrowApiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestData as any).toString()
      });

      const responseText = await response.text();
      const result = this.parseNganLuongResponse(responseText);

      if (result.error_code === '00') {
        return {
          success: true,
          message: 'Funds refunded successfully to buyer'
        };
      } else {
        return {
          success: false,
          message: result.description || 'Failed to refund escrow funds'
        };
      }
    } catch (error: any) {
      console.error('NganLuong refund escrow failed:', error);
      return {
        success: false,
        message: `Error refunding escrow: ${error.message}`
      };
    }
  }

  // Xác thực IPN từ Ngân Lượng
  async verifyIPN(data: Record<string, any>): Promise<{ isValid: boolean; transactionData?: any }> {
    try {
      // Ngân Lượng sử dụng secure_code để verify
      const receivedSecureCode = data.secure_code;
      delete data.secure_code;

      const expectedSecureCode = this.generateSignature(data);

      if (receivedSecureCode === expectedSecureCode) {
        return {
          isValid: true,
          transactionData: {
            escrowId: data.token,
            orderId: data.order_code,
            amount: parseInt(data.total_amount),
            status: data.transaction_status,
            timestamp: data.response_time,
            buyerEmail: data.buyer_email,
            sellerEmail: data.seller_email,
            paymentMethod: data.payment_method,
            bankCode: data.bank_code
          }
        };
      } else {
        console.error('NganLuong IPN signature mismatch:', {
          received: receivedSecureCode,
          expected: expectedSecureCode
        });
        return { isValid: false };
      }
    } catch (error: any) {
      console.error('NganLuong IPN verification failed:', error);
      return { isValid: false };
    }
  }

  // Truy vấn trạng thái giao dịch escrow
  async queryEscrowStatus(escrowId: string, orderId: string): Promise<any> {
    try {
      const requestData = {
        function: 'GetTransactionDetail',
        version: '3.1',
        merchant_id: this.config.merchantId,
        merchant_password: this.config.securePass,
        token: escrowId,
        order_code: orderId
      };

      const response = await fetch(`${this.config.escrowApiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestData as any).toString()
      });

      const responseText = await response.text();
      const result = this.parseNganLuongResponse(responseText);

      if (result.error_code === '00') {
        return {
          success: true,
          data: {
            escrowId: result.token,
            orderId: result.order_code,
            amount: parseInt(result.total_amount),
            status: result.transaction_status,
            createdTime: result.created_time,
            updatedTime: result.updated_time,
            buyerInfo: {
              email: result.buyer_email,
              name: result.buyer_fullname
            },
            sellerInfo: {
              email: result.seller_email,
              name: result.seller_fullname
            },
            escrowDetails: {
              detail: result.escrow_detail,
              timeoutDays: parseInt(result.timeout_days || '0')
            }
          }
        };
      } else {
        return {
          success: false,
          message: result.description || 'Failed to query escrow status'
        };
      }
    } catch (error: any) {
      console.error('NganLuong query escrow status failed:', error);
      return {
        success: false,
        message: `Error querying escrow status: ${error.message}`
      };
    }
  }

  // Tính phí giao dịch Ngân Lượng
  calculateFee(amount: number, paymentMethod: string = 'ATM_ONLINE'): { fixedFee: number; percentageFee: number; totalFee: number } {
    // Biểu phí mẫu của Ngân Lượng (cần cập nhật theo thực tế)
    const feeStructure: Record<string, { fixed: number; percentage: number }> = {
      'ATM_ONLINE': { fixed: 1760, percentage: 0 }, // 1,760 VND/giao dịch
      'INTERNET_BANKING': { fixed: 0, percentage: 0.008 }, // 0.8%
      'CREDIT_CARD': { fixed: 0, percentage: 0.035 }, // 3.5%
      'CASH_CARD': { fixed: 0, percentage: 0.025 }, // 2.5%
      'BANK_TRANSFER': { fixed: 2200, percentage: 0 } // 2,200 VND/giao dịch
    };

    const fee = feeStructure[paymentMethod] || feeStructure['ATM_ONLINE'];
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

  // Tạo escrow cho hợp tác KOC với Ngân Lượng
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
KOC Campaign Escrow - NganLuong:
- Campaign: ${params.campaignDetails.title}
- SME: ${params.smeInfo.companyName || params.smeInfo.name}
- KOC: ${params.kocInfo.name} (${params.kocInfo.socialPlatform || 'Platform TBD'})
- Total: ${params.amount.toLocaleString('vi-VN')} VND

Milestones:
${params.campaignDetails.milestones.map((milestone, index) => 
  `${index + 1}. ${milestone.title} - ${milestone.amount.toLocaleString('vi-VN')} VND`
).join('\n')}

Auto-release: ${params.autoReleasePolicy.enabled ? `${params.autoReleasePolicy.timeoutDays} days` : 'Manual only'}
Platform: NicheLink
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
        function: 'GetBankList',
        version: '3.1',
        merchant_id: this.config.merchantId,
        merchant_password: this.config.securePass
      };

      const response = await fetch(`${this.config.apiUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(requestData as any).toString()
      });

      const responseText = await response.text();
      const result = this.parseNganLuongResponse(responseText);

      if (result.error_code === '00') {
        // Parse bank list từ response
        const banks = [];
        let i = 0;
        while (result[`bank_code_${i}`]) {
          banks.push({
            code: result[`bank_code_${i}`],
            name: result[`bank_name_${i}`],
            isEscrowSupported: result[`escrow_support_${i}`] === '1'
          });
          i++;
        }

        return {
          success: true,
          banks
        };
      } else {
        return {
          success: false,
          message: result.description || 'Failed to get bank list'
        };
      }
    } catch (error: any) {
      console.error('NganLuong get banks failed:', error);
      return {
        success: false,
        message: `Error getting banks: ${error.message}`
      };
    }
  }
}

export default NganLuongService;
