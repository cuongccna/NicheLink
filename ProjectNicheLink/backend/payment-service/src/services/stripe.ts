import Stripe from 'stripe';

let stripe: Stripe;

export const initializeStripe = async (): Promise<void> => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2022-11-15',
      typescript: true,
    });

    console.log('✅ Stripe initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Stripe:', error);
    throw error;
  }
};

export const getStripe = (): Stripe => {
  if (!stripe) {
    throw new Error('Stripe not initialized. Call initializeStripe() first.');
  }
  return stripe;
};

export interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateCustomerParams {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface CreateConnectedAccountParams {
  type: 'express' | 'standard' | 'custom';
  country: string;
  email?: string;
  businessType?: 'individual' | 'company';
}

export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = getStripe();
  }

  // Payment Intent methods
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
    try {
      const createParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: params.currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
      };
      
      if (params.customerId) {
        createParams.customer = params.customerId;
      }
      
      if (params.description) {
        createParams.description = params.description;
      }
      
      if (params.metadata) {
        createParams.metadata = params.metadata;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(createParams);

      return paymentIntent;
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      throw error;
    }
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.confirm(paymentIntentId);
    } catch (error) {
      console.error('Stripe payment intent confirmation failed:', error);
      throw error;
    }
  }

  async capturePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.capture(paymentIntentId);
    } catch (error) {
      console.error('Stripe payment intent capture failed:', error);
      throw error;
    }
  }

  async refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };
      
      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }
      
      return await this.stripe.refunds.create(refundParams);
    } catch (error) {
      console.error('Stripe refund failed:', error);
      throw error;
    }
  }

  // Customer methods
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    try {
      const customerParams: Stripe.CustomerCreateParams = {
        email: params.email,
      };
      
      if (params.name) {
        customerParams.name = params.name;
      }
      
      if (params.metadata) {
        customerParams.metadata = params.metadata;
      }
      
      return await this.stripe.customers.create(customerParams);
    } catch (error) {
      console.error('Stripe customer creation failed:', error);
      throw error;
    }
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      return await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
    } catch (error) {
      console.error('Stripe customer retrieval failed:', error);
      throw error;
    }
  }

  async updateCustomer(customerId: string, params: Partial<CreateCustomerParams>): Promise<Stripe.Customer> {
    try {
      const updateParams: Stripe.CustomerUpdateParams = {};
      
      if (params.email) {
        updateParams.email = params.email;
      }
      
      if (params.name) {
        updateParams.name = params.name;
      }
      
      if (params.metadata) {
        updateParams.metadata = params.metadata;
      }
      
      return await this.stripe.customers.update(customerId, updateParams);
    } catch (error) {
      console.error('Stripe customer update failed:', error);
      throw error;
    }
  }

  // Connected Accounts (for marketplace functionality)
  async createConnectedAccount(params: CreateConnectedAccountParams): Promise<Stripe.Account> {
    try {
      const accountParams: Stripe.AccountCreateParams = {
        type: params.type,
        country: params.country,
      };
      
      if (params.email) {
        accountParams.email = params.email;
      }
      
      if (params.businessType) {
        accountParams.business_type = params.businessType;
      }
      
      return await this.stripe.accounts.create(accountParams);
    } catch (error) {
      console.error('Stripe connected account creation failed:', error);
      throw error;
    }
  }

  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string): Promise<Stripe.AccountLink> {
    try {
      return await this.stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: 'account_onboarding',
      });
    } catch (error) {
      console.error('Stripe account link creation failed:', error);
      throw error;
    }
  }

  // Transfer methods
  async createTransfer(amount: number, destination: string, currency: string = 'usd'): Promise<Stripe.Transfer> {
    try {
      return await this.stripe.transfers.create({
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase(),
        destination,
      });
    } catch (error) {
      console.error('Stripe transfer failed:', error);
      throw error;
    }
  }

  // Webhook verification
  verifyWebhookSignature(payload: string | Buffer, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (error) {
      console.error('Stripe webhook verification failed:', error);
      throw error;
    }
  }

  // Escrow-specific methods
  async holdFunds(amount: number, currency: string, customerId: string, description: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.createPaymentIntent({
        amount,
        currency,
        customerId,
        description: `Escrow: ${description}`,
        metadata: {
          type: 'escrow',
          status: 'held'
        }
      });
    } catch (error) {
      console.error('Stripe escrow hold failed:', error);
      throw error;
    }
  }

  async releaseFunds(paymentIntentId: string, destinationAccount?: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.capturePaymentIntent(paymentIntentId);
      
      if (destinationAccount) {
        // Create transfer to connected account
        await this.createTransfer(
          paymentIntent.amount / 100,
          destinationAccount,
          paymentIntent.currency
        );
      }
      
      return paymentIntent;
    } catch (error) {
      console.error('Stripe escrow release failed:', error);
      throw error;
    }
  }
}

export default StripeService;
