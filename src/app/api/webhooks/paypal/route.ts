import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { paypalService } from '@/lib/paypal';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    logger.info('PAYPAL_WEBHOOK_RECEIVED', 'PayPal webhook received', {
      data: {
        eventType: JSON.parse(body).event_type,
        transmissionId: headers['paypal-transmission-id']
      }
    });

    // Verify webhook signature (in production)
    if (process.env.NODE_ENV === 'production' && process.env.PAYPAL_WEBHOOK_ID) {
      const isValid = await paypalService.verifyWebhookSignature(body, headers);
      if (!isValid) {
        logger.error('PAYPAL_WEBHOOK_INVALID', 'Invalid PayPal webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    await connectToDatabase();
    
    switch (event.event_type) {
      case "BILLING.SUBSCRIPTION.CREATED":
        await handleSubscriptionCreated(event);
        break;
      
      case "BILLING.SUBSCRIPTION.ACTIVATED":
        await handleSubscriptionActivated(event);
        break;
      
      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handleSubscriptionCancelled(event);
        break;
      
      case "BILLING.SUBSCRIPTION.SUSPENDED":
        await handleSubscriptionSuspended(event);
        break;
      
      case "PAYMENT.SALE.COMPLETED":
        await handlePaymentCompleted(event);
        break;

      case "CHECKOUT.ORDER.APPROVED":
        await handleOrderApproved(event);
        break;
      
      default:
        logger.info('PAYPAL_WEBHOOK_UNHANDLED', 'Unhandled PayPal event type', {
          data: { eventType: event.event_type }
        });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('PAYPAL_WEBHOOK_ERROR', 'PayPal webhook processing failed', { error });
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}

async function handleSubscriptionCreated(event: any) {
  const resource = event.resource;
  const userId = resource.custom_id;

  if (!userId) {
    logger.warn('PAYPAL_SUBSCRIPTION_NO_USER', 'Subscription created without user ID', {
      data: { subscriptionId: resource.id }
    });
    return;
  }

  logger.info('PAYPAL_SUBSCRIPTION_CREATED', 'PayPal subscription created', {
    userId,
    data: {
      subscriptionId: resource.id,
      planId: resource.plan_id,
      status: resource.status
    }
  });
}

async function handleSubscriptionActivated(event: any) {
  const resource = event.resource;
  const userId = resource.custom_id;
  const paypalSubscriptionId = resource.id;
  const planId = resource.plan_id;

  if (!userId) {
    logger.warn('PAYPAL_SUBSCRIPTION_NO_USER', 'Subscription activated without user ID', {
      data: { subscriptionId: paypalSubscriptionId }
    });
    return;
  }

  // Determine plan type from plan ID or amount
  const planMapping = await determinePlanType(planId, resource);

  // Update or create subscription
  let subscription = await Subscription.findOne({ userId, isActive: true });

  if (subscription) {
    subscription.paypalSubscriptionId = paypalSubscriptionId;
    subscription.planType = planMapping.planType;
    subscription.planName = planMapping.planName;
    subscription.monthlyPrice = planMapping.price;
    subscription.monthlyMinuteLimit = planMapping.minuteLimit;
    subscription.assistantLimit = planMapping.assistantLimit;
    subscription.isActive = true;
    subscription.isTrial = false;
    subscription.trialEndsAt = undefined;
  } else {
    subscription = new Subscription({
      userId,
      paypalSubscriptionId,
      planType: planMapping.planType,
      planName: planMapping.planName,
      monthlyPrice: planMapping.price,
      monthlyMinuteLimit: planMapping.minuteLimit,
      assistantLimit: planMapping.assistantLimit,
      isActive: true,
      isTrial: false
    });
  }

  await subscription.save();

  logger.info('PAYPAL_SUBSCRIPTION_ACTIVATED', 'Subscription activated and saved', {
    userId,
    data: {
      subscriptionId: subscription._id,
      paypalSubscriptionId,
      planType: planMapping.planType
    }
  });
}

async function handleSubscriptionCancelled(event: any) {
  const resource = event.resource;
  const paypalSubscriptionId = resource.id;

  const subscription = await Subscription.findOne({ 
    paypalSubscriptionId, 
    isActive: true 
  });

  if (subscription) {
    subscription.isActive = false;
    subscription.cancelledAt = new Date();
    await subscription.save();

    logger.info('PAYPAL_SUBSCRIPTION_CANCELLED', 'Subscription cancelled', {
      userId: subscription.userId,
      data: {
        subscriptionId: subscription._id,
        paypalSubscriptionId
      }
    });
  }
}

async function handleSubscriptionSuspended(event: any) {
  const resource = event.resource;
  const paypalSubscriptionId = resource.id;

  const subscription = await Subscription.findOne({ 
    paypalSubscriptionId, 
    isActive: true 
  });

  if (subscription) {
    subscription.isActive = false;
    await subscription.save();

    logger.info('PAYPAL_SUBSCRIPTION_SUSPENDED', 'Subscription suspended', {
      userId: subscription.userId,
      data: {
        subscriptionId: subscription._id,
        paypalSubscriptionId
      }
    });
  }
}

async function handlePaymentCompleted(event: any) {
  const resource = event.resource;
  const paypalSubscriptionId = resource.billing_agreement_id;

  if (paypalSubscriptionId) {
    // This is a subscription payment
    const subscription = await Subscription.findOne({ 
      paypalSubscriptionId, 
      isActive: true 
    });

    if (subscription) {
      // Reset billing period for new payment
      subscription.resetBillingPeriod();
      await subscription.save();

      logger.info('PAYPAL_SUBSCRIPTION_PAYMENT', 'Subscription payment received', {
        userId: subscription.userId,
        data: {
          paymentId: resource.id,
          amount: resource.amount.total,
          subscriptionId: subscription._id
        }
      });
    }
  } else {
    // This is a one-time payment (add-ons)
    logger.info('PAYPAL_ONETIME_PAYMENT', 'One-time payment completed', {
      data: {
        paymentId: resource.id,
        amount: resource.amount.total,
        customId: resource.custom
      }
    });
  }
}

async function handleOrderApproved(event: any) {
  const resource = event.resource;
  const userId = resource.purchase_units?.[0]?.custom_id;

  if (userId) {
    logger.info('PAYPAL_ORDER_APPROVED', 'PayPal order approved', {
      userId,
      data: {
        orderId: resource.id,
        amount: resource.purchase_units?.[0]?.amount?.value
      }
    });
  }
}

async function determinePlanType(planId: string, resource: any): Promise<any> {
  // Map PayPal plan IDs to our plan types
  // This would be configured based on your PayPal plan setup
  const planMappings: Record<string, any> = {
    'starter': { planType: 'starter', planName: 'Starter Plan', price: 49, minuteLimit: 500, assistantLimit: 1 },
    'growth': { planType: 'growth', planName: 'Growth Plan', price: 149, minuteLimit: 2000, assistantLimit: 3 },
    'pro': { planType: 'pro', planName: 'Pro Plan', price: 399, minuteLimit: 7000, assistantLimit: 10 },
    'enterprise': { planType: 'enterprise', planName: 'Enterprise Plan', price: 999, minuteLimit: -1, assistantLimit: -1 },
    'payg': { planType: 'payg', planName: 'Pay-as-you-go', price: 19, minuteLimit: -1, assistantLimit: -1 }
  };

  // Try to match by plan ID first
  for (const [key, mapping] of Object.entries(planMappings)) {
    if (planId.toLowerCase().includes(key)) {
      return mapping;
    }
  }

  // Fallback: determine by price
  const amount = parseFloat(resource.billing_info?.last_payment?.amount?.value || '49');
  if (amount <= 49) return planMappings.starter;
  if (amount <= 149) return planMappings.growth;
  if (amount <= 399) return planMappings.pro;
  if (amount <= 999) return planMappings.enterprise;

  // Default to starter
  return planMappings.starter;
}