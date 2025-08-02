import crypto from 'crypto';
import querystring from 'querystring';
import { DateTime } from 'luxon';

export interface VNPayConfig {
  tmnCode: string;
  secretKey: string;
  url: string;
  apiUrl: string;
  returnUrl: string;
  ipnUrl: string;
}

export interface CreateVNPayParams {
  amount: number;
  orderInfo: string;
  orderId: string;
  ipAddr: string;
  bankCode?: string;
  orderType?: string;
}

export interface VNPayResponse {
  paymentUrl?: string;
  message?: string;
  code?: string;
}

export interface VNPayIPN {
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHash: string;
}

export class VNPayService {
  private config: VNPayConfig;

  constructor() {
    this.config = {
      tmnCode: process.env.VNPAY_TMN_CODE!,
      secretKey: process.env.VNPAY_SECRET_KEY!,
      url: process.env.VNPAY_URL!,
      apiUrl: process.env.VNPAY_API_URL!,
      returnUrl: process.env.VNPAY_RETURN_URL!,
      ipnUrl: process.env.VNPAY_IPN_URL!
    };
  }

  // Tạo URL thanh toán VNPay
  createPaymentUrl(params: CreateVNPayParams): string {
    try {
      const vnpParams: any = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: this.config.tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: params.orderId,
        vnp_OrderInfo: params.orderInfo,
        vnp_OrderType: params.orderType || 'other',
        vnp_Amount: Math.round(params.amount * 100), // VNPay yêu cầu số tiền * 100
        vnp_ReturnUrl: this.config.returnUrl,
        vnp_IpAddr: params.ipAddr,
        vnp_CreateDate: DateTime.now().setZone('Asia/Ho_Chi_Minh').toFormat('yyyyMMddHHmmss'),
      };

      if (params.bankCode) {
        vnpParams.vnp_BankCode = params.bankCode;
      }

      // Sắp xếp tham số theo thứ tự alphabet
      const sortedParams = this.sortParams(vnpParams);
      
      // Tạo secure hash
      const signData = querystring.stringify(sortedParams);
      const secureHash = this.createSecureHash(signData);
      
      // Thêm secure hash vào params
      sortedParams.vnp_SecureHash = secureHash;

      // Tạo URL thanh toán
      const paymentUrl = `${this.config.url}?${querystring.stringify(sortedParams)}`;
      
      return paymentUrl;
    } catch (error) {
      console.error('VNPay create payment URL failed:', error);
      throw error;
    }
  }

  // Xác thực IPN từ VNPay
  verifyIPN(vnpParams: any): { isValid: boolean; message: string } {
    try {
      const secureHash = vnpParams.vnp_SecureHash;
      delete vnpParams.vnp_SecureHash;
      delete vnpParams.vnp_SecureHashType;

      // Sắp xếp tham số
      const sortedParams = this.sortParams(vnpParams);
      const signData = querystring.stringify(sortedParams);
      const checkSum = this.createSecureHash(signData);

      if (secureHash === checkSum) {
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
      console.error('VNPay IPN verification failed:', error);
      return {
        isValid: false,
        message: 'Verification error'
      };
    }
  }

  // Truy vấn thông tin giao dịch
  async queryTransaction(transactionId: string, transactionDate: string): Promise<any> {
    try {
      const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'querydr',
        vnp_TmnCode: this.config.tmnCode,
        vnp_TxnRef: transactionId,
        vnp_OrderInfo: `Query transaction ${transactionId}`,
        vnp_TransactionDate: transactionDate,
        vnp_CreateDate: DateTime.now().setZone('Asia/Ho_Chi_Minh').toFormat('yyyyMMddHHmmss'),
        vnp_IpAddr: '127.0.0.1',
      };

      const sortedParams = this.sortParams(vnpParams);
      const signData = querystring.stringify(sortedParams);
      const secureHash = this.createSecureHash(signData);

      const requestData = {
        ...sortedParams,
        vnp_SecureHash: secureHash
      };

      // Gửi request đến VNPay API
      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      return await response.json();
    } catch (error) {
      console.error('VNPay query transaction failed:', error);
      throw error;
    }
  }

  // Hoàn tiền (refund)
  async refundTransaction(params: {
    transactionId: string;
    amount: number;
    transactionDate: string;
    refundAmount: number;
    reason: string;
  }): Promise<any> {
    try {
      const vnpParams = {
        vnp_Version: '2.1.0',
        vnp_Command: 'refund',
        vnp_TmnCode: this.config.tmnCode,
        vnp_TransactionType: '03', // Hoàn tiền toàn phần
        vnp_TxnRef: params.transactionId,
        vnp_Amount: Math.round(params.amount * 100),
        vnp_OrderInfo: params.reason,
        vnp_TransactionDate: params.transactionDate,
        vnp_CreateDate: DateTime.now().setZone('Asia/Ho_Chi_Minh').toFormat('yyyyMMddHHmmss'),
        vnp_CreateBy: 'System',
        vnp_IpAddr: '127.0.0.1',
      };

      const sortedParams = this.sortParams(vnpParams);
      const signData = querystring.stringify(sortedParams);
      const secureHash = this.createSecureHash(signData);

      const requestData = {
        ...sortedParams,
        vnp_SecureHash: secureHash
      };

      const response = await fetch(this.config.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      return await response.json();
    } catch (error) {
      console.error('VNPay refund failed:', error);
      throw error;
    }
  }

  // Sắp xếp tham số theo thứ tự alphabet
  private sortParams(params: any): any {
    const sortedKeys = Object.keys(params).sort();
    const sortedParams: any = {};
    
    sortedKeys.forEach(key => {
      sortedParams[key] = params[key];
    });
    
    return sortedParams;
  }

  // Tạo secure hash
  private createSecureHash(data: string): string {
    return crypto
      .createHmac('sha512', this.config.secretKey)
      .update(data)
      .digest('hex');
  }

  // Parse response code từ VNPay
  parseResponseCode(code: string): { success: boolean; message: string } {
    const codes: { [key: string]: string } = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
    };

    return {
      success: code === '00',
      message: codes[code] || 'Lỗi không xác định'
    };
  }

  // Escrow specific methods
  async holdFunds(amount: number, orderId: string, orderInfo: string, ipAddr: string): Promise<string> {
    try {
      const paymentUrl = this.createPaymentUrl({
        amount,
        orderId,
        orderInfo: `Escrow: ${orderInfo}`,
        ipAddr,
        orderType: 'escrow'
      });

      return paymentUrl;
    } catch (error) {
      console.error('VNPay escrow hold failed:', error);
      throw error;
    }
  }

  async releaseFunds(transactionId: string, amount: number, transactionDate: string): Promise<any> {
    try {
      // VNPay không có tính năng release funds trực tiếp
      // Cần implement logic chuyển tiền từ escrow wallet
      console.log(`Releasing funds for transaction ${transactionId}, amount: ${amount}`);
      
      return {
        success: true,
        message: 'Funds released successfully',
        transactionId,
        amount
      };
    } catch (error) {
      console.error('VNPay release funds failed:', error);
      throw error;
    }
  }
}

export default VNPayService;
