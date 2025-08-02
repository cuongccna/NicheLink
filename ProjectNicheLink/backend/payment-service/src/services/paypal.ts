import paypal from '@paypal/checkout-server-sdk';

let payPalClient: paypal.core.PayPalHttpClient;

export const initializePayPal = async (): Promise<void> => {
  try {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal credentials are not configured');
    }

    // Configure environment
    const environment = process.env.PAYPAL_MODE === 'production'
      ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
      : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

    payPalClient = new paypal.core.PayPalHttpClient(environment);

    console.log('✅ PayPal initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize PayPal:', error);
    throw error;
  }
};

export const getPayPalClient = (): paypal.core.PayPalHttpClient => {
  if (!payPalClient) {
    throw new Error('PayPal not initialized. Call initializePayPal() first.');
  }
  return payPalClient;
};

export interface CreateOrderParams {
  amount: string;
  currency: string;
  description?: string;
  referenceId?: string;
  payeeEmail?: string;
}

export interface CaptureOrderParams {
  orderId: string;
  note?: string;
}

export interface RefundParams {
  captureId: string;
  amount?: string;
  currency?: string;
  note?: string;
}

export class PayPalService {
  private client: paypal.core.PayPalHttpClient;

  constructor() {
    this.client = getPayPalClient();
  }

  // Order methods
  async createOrder(params: CreateOrderParams): Promise<any> {
    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      const purchaseUnit: any = {
        reference_id: params.referenceId || 'default',
        description: params.description || 'NicheLink Payment',
        amount: {
          currency_code: params.currency.toUpperCase(),
          value: params.amount,
        },
      };
      
      if (params.payeeEmail) {
        purchaseUnit.payee = {
          email_address: params.payeeEmail
        };
      }

      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [purchaseUnit],
        application_context: {
          brand_name: 'NicheLink',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        }
      });

      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal order creation failed:', error);
      throw error;
    }
  }

  async captureOrder(params: CaptureOrderParams): Promise<any> {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(params.orderId);
      request.prefer("return=representation");
      
      if (params.note) {
        // Note: PayPal note_to_payer might not be supported in capture request
        // The note should be included in the original order creation
        console.log('Note for capture:', params.note);
      }

      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal order capture failed:', error);
      throw error;
    }
  }

  async getOrder(orderId: string): Promise<any> {
    try {
      const request = new paypal.orders.OrdersGetRequest(orderId);
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal order retrieval failed:', error);
      throw error;
    }
  }

  // Payment methods
  async refundPayment(params: RefundParams): Promise<any> {
    try {
      const request = new paypal.payments.CapturesRefundRequest(params.captureId);
      request.prefer("return=representation");
      const requestBody: any = {};
      
      if (params.amount && params.currency) {
        requestBody.amount = {
          currency_code: params.currency.toUpperCase(),
          value: params.amount,
        };
      }
      
      if (params.note) {
        requestBody.note_to_payer = params.note;
      }
      
      request.requestBody(requestBody);

      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal refund failed:', error);
      throw error;
    }
  }

  async getPayment(paymentId: string): Promise<any> {
    try {
      const request = new paypal.payments.CapturesGetRequest(paymentId);
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal payment retrieval failed:', error);
      throw error;
    }
  }

  // Payout methods (for marketplace functionality)
  async createPayout(items: Array<{
    recipientType: 'EMAIL' | 'PHONE' | 'PAYPAL_ID';
    receiver: string;
    amount: string;
    currency: string;
    note?: string;
    senderItemId?: string;
  }>): Promise<any> {
    try {
      const request = new (paypal as any).payouts.PayoutsPostRequest();
      request.requestBody({
        sender_batch_header: {
          sender_batch_id: `batch_${Date.now()}`,
          email_subject: 'You have a payment from NicheLink',
          email_message: 'You have received a payment from NicheLink platform.',
        },
        items: items.map(item => ({
          recipient_type: item.recipientType,
          amount: {
            value: item.amount,
            currency: item.currency.toUpperCase(),
          },
          receiver: item.receiver,
          note: item.note || 'Payment from NicheLink',
          sender_item_id: item.senderItemId || `item_${Date.now()}`,
        }))
      });

      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal payout failed:', error);
      throw error;
    }
  }

  async getPayoutStatus(payoutBatchId: string): Promise<any> {
    try {
      const request = new (paypal as any).payouts.PayoutsGetRequest(payoutBatchId);
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal payout status retrieval failed:', error);
      throw error;
    }
  }

  // Escrow-specific methods
  async holdFunds(amount: string, currency: string, description: string, referenceId: string): Promise<any> {
    try {
      // Create order but don't capture immediately
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer("return=representation");
      request.requestBody({
        intent: 'AUTHORIZE', // Hold funds without capturing
        purchase_units: [{
          reference_id: referenceId,
          description: `Escrow: ${description}`,
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount,
          },
        }],
        application_context: {
          brand_name: 'NicheLink Escrow',
          landing_page: 'BILLING',
          user_action: 'CONTINUE',
        }
      });

      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal escrow hold failed:', error);
      throw error;
    }
  }

  async releaseFunds(authorizationId: string, amount?: string, currency?: string): Promise<any> {
    try {
      const request = new paypal.payments.AuthorizationsCaptureRequest(authorizationId);
      request.prefer("return=representation");
      
      if (amount && currency) {
        const requestBody: any = {
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount,
          },
          final_capture: true,
        };
        request.requestBody(requestBody);
      }

      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal escrow release failed:', error);
      throw error;
    }
  }

  async voidAuthorization(authorizationId: string): Promise<any> {
    try {
      const request = new paypal.payments.AuthorizationsVoidRequest(authorizationId);
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      console.error('PayPal authorization void failed:', error);
      throw error;
    }
  }

  // Webhook verification
  verifyWebhook(headers: any, body: string): boolean {
    try {
      // PayPal webhook verification logic
      // This is a simplified version - implement full verification as needed
      const authAlgo = headers['paypal-auth-algo'];
      const transmission = headers['paypal-transmission-id'];
      const certId = headers['paypal-cert-id'];
      const signature = headers['paypal-transmission-sig'];
      const timestamp = headers['paypal-transmission-time'];

      // Implement webhook verification logic based on PayPal documentation
      return true; // Placeholder
    } catch (error) {
      console.error('PayPal webhook verification failed:', error);
      return false;
    }
  }
}

export default PayPalService;
