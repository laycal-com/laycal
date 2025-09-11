import { logger } from './logger';

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_ENVIRONMENT = process.env.NEXT_PUBLIC_PAYPAL_ENVIRONMENT || 'sandbox';

const PAYPAL_BASE_URL = PAYPAL_ENVIRONMENT === 'production' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

export interface PayPalSubscriptionPlan {
  planId: string;
  name: string;
  description: string;
  value: string;
  frequency: string;
  tenure_type: string;
  sequence: number;
}

export interface PayPalOneTimePayment {
  amount: number;
  description: string;
  currency?: string;
}

export interface PayPalUsageCharge {
  userId: string;
  amount: number;
  description: string;
  type: 'usage-based' | 'platform-fee' | 'overage';
}

export class PayPalService {
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal credentials not configured');
    }

    try {
      const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
      
      const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal auth failed: ${response.status} - ${error}`);
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer

      return this.accessToken;
    } catch (error) {
      logger.error('PAYPAL_AUTH_ERROR', 'Failed to get PayPal access token', { error });
      throw error;
    }
  }

  // Create subscription plan
  async createSubscriptionPlan(plan: PayPalSubscriptionPlan): Promise<string> {
    try {
      const accessToken = await this.getAccessToken();

      const requestBody = {
        product_id: 'SAAS_VOICE_ASSISTANT',
        name: plan.name,
        description: plan.description,
        status: 'ACTIVE',
        billing_cycles: [
          {
            frequency: {
              interval_unit: plan.frequency.toUpperCase(),
              interval_count: 1,
            },
            tenure_type: plan.tenure_type.toUpperCase(),
            sequence: plan.sequence,
            total_cycles: 0, // Infinite
            pricing_scheme: {
              fixed_price: {
                value: plan.value,
                currency_code: 'USD',
              },
            },
          },
        ],
        payment_preferences: {
          auto_bill_outstanding: true,
          setup_fee_failure_action: 'CONTINUE',
          payment_failure_threshold: 3,
        },
      };

      const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/plans`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `plan-${Date.now()}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal plan creation failed: ${response.status} - ${error}`);
      }

      const result = await response.json();
      
      logger.info('PAYPAL_PLAN_CREATED', 'PayPal subscription plan created', {
        planId: result.id,
        name: plan.name
      });

      return result.id;
    } catch (error) {
      logger.error('PAYPAL_PLAN_ERROR', 'Failed to create PayPal plan', { error, plan });
      throw error;
    }
  }

  // Create subscription
  async createSubscription(planId: string, userId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const requestBody = {
        plan_id: planId,
        start_time: new Date(Date.now() + 5000).toISOString(), // Start in 5 seconds
        quantity: 1,
        subscriber: {
          name: {
            given_name: 'User',
            surname: userId.slice(0, 10),
          },
        },
        custom_id: userId,
        application_context: {
          brand_name: 'AI Voice Assistant',
          locale: 'en-US',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: {
            payer_selected: 'PAYPAL',
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
          },
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription=cancelled`,
        },
      };

      const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `sub-${userId}-${Date.now()}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal subscription creation failed: ${response.status} - ${error}`);
      }

      const result = await response.json();
      
      logger.info('PAYPAL_SUBSCRIPTION_CREATED', 'PayPal subscription created', {
        subscriptionId: result.id,
        userId,
        planId
      });

      return result;
    } catch (error) {
      logger.error('PAYPAL_SUBSCRIPTION_ERROR', 'Failed to create PayPal subscription', { 
        error, 
        userId, 
        planId 
      });
      throw error;
    }
  }

  // Create one-time payment for add-ons
  async createOneTimePayment(payment: PayPalOneTimePayment, userId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const requestBody = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: payment.currency || 'USD',
              value: payment.amount.toFixed(2),
            },
            description: payment.description,
            custom_id: userId,
          },
        ],
        application_context: {
          brand_name: 'AI Voice Assistant',
          landing_page: 'NO_PREFERENCE',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?payment=cancelled`,
        },
      };

      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'PayPal-Request-Id': `payment-${userId}-${Date.now()}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal payment creation failed: ${response.status} - ${error}`);
      }

      const result = await response.json();
      
      logger.info('PAYPAL_PAYMENT_CREATED', 'PayPal one-time payment created', {
        orderId: result.id,
        userId,
        amount: payment.amount,
        description: payment.description
      });

      return result;
    } catch (error) {
      logger.error('PAYPAL_PAYMENT_ERROR', 'Failed to create PayPal payment', { 
        error, 
        userId, 
        payment 
      });
      throw error;
    }
  }

  // Create usage-based charge for PAYG users
  async createUsageCharge(charge: PayPalUsageCharge): Promise<any> {
    try {
      // For PAYG users, we'll create a one-time payment
      const payment: PayPalOneTimePayment = {
        amount: charge.amount,
        description: charge.description,
        currency: 'USD'
      };

      const result = await this.createOneTimePayment(payment, charge.userId);
      
      logger.info('PAYPAL_USAGE_CHARGE', 'Usage-based charge created', {
        orderId: result.id,
        userId: charge.userId,
        amount: charge.amount,
        type: charge.type
      });

      return result;
    } catch (error) {
      logger.error('PAYPAL_USAGE_CHARGE_ERROR', 'Failed to create usage charge', { 
        error, 
        charge 
      });
      throw error;
    }
  }

  // Get order details
  async getOrderDetails(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal order fetch failed: ${response.status} - ${error}`);
      }

      const result = await response.json();
      
      logger.info('PAYPAL_ORDER_FETCHED', 'PayPal order details retrieved', {
        orderId,
        status: result.status
      });

      return result;
    } catch (error) {
      logger.error('PAYPAL_ORDER_FETCH_ERROR', 'Failed to fetch PayPal order', { 
        error, 
        orderId 
      });
      throw error;
    }
  }

  // Capture payment after user approval
  async capturePayment(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal payment capture failed: ${response.status} - ${error}`);
      }

      const result = await response.json();
      
      logger.info('PAYPAL_PAYMENT_CAPTURED', 'PayPal payment captured', {
        orderId,
        captureId: result.purchase_units[0]?.payments?.captures?.[0]?.id
      });

      return result;
    } catch (error) {
      logger.error('PAYPAL_CAPTURE_ERROR', 'Failed to capture PayPal payment', { 
        error, 
        orderId 
      });
      throw error;
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal subscription cancellation failed: ${response.status} - ${error}`);
      }

      logger.info('PAYPAL_SUBSCRIPTION_CANCELLED', 'PayPal subscription cancelled', {
        subscriptionId,
        reason
      });
    } catch (error) {
      logger.error('PAYPAL_CANCEL_ERROR', 'Failed to cancel PayPal subscription', { 
        error, 
        subscriptionId 
      });
      throw error;
    }
  }

  // Get subscription details
  async getSubscription(subscriptionId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(`${PAYPAL_BASE_URL}/v1/billing/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`PayPal subscription fetch failed: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('PAYPAL_FETCH_ERROR', 'Failed to fetch PayPal subscription', { 
        error, 
        subscriptionId 
      });
      throw error;
    }
  }

  // Verify webhook signature
  async verifyWebhookSignature(body: string, headers: any): Promise<boolean> {
    try {
      const accessToken = await this.getAccessToken();

      const requestBody = {
        auth_algo: headers['paypal-auth-algo'],
        cert_id: headers['paypal-cert-id'],
        transmission_id: headers['paypal-transmission-id'],
        transmission_sig: headers['paypal-transmission-sig'],
        transmission_time: headers['paypal-transmission-time'],
        webhook_id: process.env.PAYPAL_WEBHOOK_ID,
        webhook_event: JSON.parse(body),
      };

      const response = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return result.verification_status === 'SUCCESS';
    } catch (error) {
      logger.error('PAYPAL_WEBHOOK_VERIFY_ERROR', 'Failed to verify PayPal webhook', { error });
      return false;
    }
  }
}

export const paypalService = new PayPalService();