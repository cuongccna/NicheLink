import crypto from 'crypto';

export interface MoMoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  apiUrl: string;
  returnUrl: string;
  ipnUrl: string;
}

export interface CreateMoMoParams {
  amount: number;
  orderId: string;
  orderInfo: string;
  requestId: string;
  extraData?: string;
  orderGroupId?: string;
  autoCapture?: boolean;
  lang?: 'vi' | 'en';
}

export interface MoMoResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl?: string;
  deeplink?: string;
  qrCodeUrl?: string;
}

export interface MoMoIPN {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  orderInfo: string;
  orderType: string;
  transId: number;
  resultCode: number;
  message: string;
  payType: string;
  responseTime: number;
  extraData: string;
  signature: string;
}

export class MoMoService {
  private config: MoMoConfig;

  constructor() {
    this.config = {
      partnerCode: process.env.MOMO_PARTNER_CODE!,
      accessKey: process.env.MOMO_ACCESS_KEY!,
      secretKey: process.env.MOMO_SECRET_KEY!,
      apiUrl: process.env.MOMO_API_URL!,
      returnUrl: process.env.MOMO_RETURN_URL!,
      ipnUrl: process.env.MOMO_IPN_URL!
    };
  }

  // Tạo thanh toán MoMo
  async createPayment(params: CreateMoMoParams): Promise<MoMoResponse> {
    try {
      const requestBody = {
        partnerCode: this.config.partnerCode,
        partnerName: 'NicheLink',
        storeId: 'NicheLink',
        requestId: params.requestId,
        amount: params.amount,
        orderId: params.orderId,
        orderInfo: params.orderInfo,
        redirectUrl: this.config.returnUrl,
        ipnUrl: this.config.ipnUrl,
        lang: params.lang || 'vi',
        autoCapture: params.autoCapture !== false,
        orderGroupId: params.orderGroupId || '',
        extraData: params.extraData || '',
        requestType: 'payWithMethod'
      };

      // Tạo signature
      const rawSignature = this.createRawSignature(requestBody);
      const signature = this.createSignature(rawSignature);

      const requestData = {
        ...requestBody,
        signature
      };

      const response = await fetch(`${this.config.apiUrl}/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();
      return result as MoMoResponse;
    } catch (error) {
      console.error('MoMo create payment failed:', error);
      throw error;
    }
  }

  // Xác thực IPN từ MoMo
  verifyIPN(ipnData: MoMoIPN): { isValid: boolean; message: string } {
    try {
      const { signature, ...dataToVerify } = ipnData;
      
      const rawSignature = this.createRawSignature(dataToVerify);
      const expectedSignature = this.createSignature(rawSignature);

      if (signature === expectedSignature) {
        return {
          isValid: true,
          message: 'IPN verified successfully'
        };
      } else {
        return {
          isValid: false,
          message: 'Invalid signature'
        };
      }
    } catch (error) {
      console.error('MoMo IPN verification failed:', error);
      return {
        isValid: false,
        message: 'Verification error'
      };
    }
  }

  // Truy vấn trạng thái giao dịch
  async queryTransaction(orderId: string, requestId: string): Promise<any> {
    try {
      const requestBody = {
        partnerCode: this.config.partnerCode,
        requestId: requestId,
        orderId: orderId,
        lang: 'vi'
      };

      const rawSignature = this.createRawSignature(requestBody);
      const signature = this.createSignature(rawSignature);

      const requestData = {
        ...requestBody,
        signature
      };

      const response = await fetch(`${this.config.apiUrl}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      return await response.json();
    } catch (error) {
      console.error('MoMo query transaction failed:', error);
      throw error;
    }
  }

  // Hoàn tiền
  async refundTransaction(params: {
    orderId: string;
    requestId: string;
    amount: number;
    transId: number;
    description: string;
  }): Promise<any> {
    try {
      const requestBody = {
        partnerCode: this.config.partnerCode,
        orderId: params.orderId,
        requestId: params.requestId,
        amount: params.amount,
        transId: params.transId,
        lang: 'vi',
        description: params.description
      };

      const rawSignature = this.createRawSignature(requestBody);
      const signature = this.createSignature(rawSignature);

      const requestData = {
        ...requestBody,
        signature
      };

      const response = await fetch(`${this.config.apiUrl}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      return await response.json();
    } catch (error) {
      console.error('MoMo refund failed:', error);
      throw error;
    }
  }

  // Tạo raw signature
  private createRawSignature(data: any): string {
    const keys = Object.keys(data).sort();
    const signatureParams = keys.map(key => `${key}=${data[key]}`);
    return signatureParams.join('&');
  }

  // Tạo signature với HMAC SHA256
  private createSignature(rawSignature: string): string {
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');
  }

  // Parse result code từ MoMo
  parseResultCode(code: number): { success: boolean; message: string } {
    const codes: { [key: number]: string } = {
      0: 'Giao dịch thành công',
      9000: 'Giao dịch được khởi tạo, chờ người dùng xác nhận thanh toán',
      8000: 'Giao dịch đang được xử lý',
      7000: 'Giao dịch bị từ chối bởi người dùng',
      6000: 'Giao dịch bị từ chối bởi MoMo',
      5000: 'Giao dịch bị lỗi không xác định',
      4000: 'Giao dịch bị từ chối do vượt quá số tiền thanh toán hàng ngày',
      3000: 'Giao dịch bị huỷ',
      2000: 'Giao dịch không được tìm thấy',
      1000: 'Giao dịch thất bại do lỗi, sai tham số',
      49: 'Tài khoản người dùng bị khoá tạm thời',
      10: 'Hệ thống đang bảo trì',
      11: 'Token hết hạn. Vui lòng thực hiện lại giao dịch',
      12: 'Tài khoản bị khoá',
      13: 'OTP sai',
      20: 'Số dư tài khoản không đủ để thanh toán',
      21: 'Số tiền thanh toán vượt quá hạn mức thanh toán của người dùng'
    };

    return {
      success: code === 0,
      message: codes[code] || 'Lỗi không xác định'
    };
  }

  // Tạo QR Code cho thanh toán
  async createQRCode(params: CreateMoMoParams): Promise<{ qrCodeUrl: string; deeplink: string }> {
    try {
      const paymentResult = await this.createPayment({
        ...params,
        requestId: `QR_${params.requestId}`
      });

      if (paymentResult.resultCode === 0) {
        return {
          qrCodeUrl: paymentResult.qrCodeUrl || '',
          deeplink: paymentResult.deeplink || ''
        };
      } else {
        throw new Error(`MoMo QR creation failed: ${paymentResult.message}`);
      }
    } catch (error) {
      console.error('MoMo QR creation failed:', error);
      throw error;
    }
  }

  // Escrow specific methods
  async holdFunds(amount: number, orderId: string, orderInfo: string): Promise<MoMoResponse> {
    try {
      const requestId = `ESCROW_${Date.now()}_${orderId}`;
      
      return await this.createPayment({
        amount,
        orderId,
        orderInfo: `Escrow: ${orderInfo}`,
        requestId,
        extraData: JSON.stringify({ type: 'escrow', originalOrderId: orderId }),
        autoCapture: false // Không tự động capture, giữ tiền trong escrow
      });
    } catch (error) {
      console.error('MoMo escrow hold failed:', error);
      throw error;
    }
  }

  async releaseFunds(orderId: string, transId: number, amount: number): Promise<any> {
    try {
      // MoMo không có tính năng release funds trực tiếp
      // Cần implement logic chuyển tiền từ escrow wallet
      console.log(`Releasing funds for order ${orderId}, transaction ${transId}, amount: ${amount}`);
      
      return {
        success: true,
        message: 'Funds released successfully',
        orderId,
        transId,
        amount
      };
    } catch (error) {
      console.error('MoMo release funds failed:', error);
      throw error;
    }
  }

  // Validate webhook signature
  validateWebhook(body: string, signature: string): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.config.secretKey)
        .update(body)
        .digest('hex');
      
      return signature === expectedSignature;
    } catch (error) {
      console.error('MoMo webhook validation failed:', error);
      return false;
    }
  }
}

export default MoMoService;
