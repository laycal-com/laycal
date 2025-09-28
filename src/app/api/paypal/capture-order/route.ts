import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { paypalService } from '@/lib/paypal';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import Credit from '@/models/Credit';
import PendingTransaction from '@/models/PendingTransaction';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    console.log('=== PAYPAL CAPTURE START ===');
    const { userId } = await auth();
    console.log('User ID:', userId);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, planType, amount, description } = await request.json();
    console.log('Capture request data:', { orderId, planType, amount, description });

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    await connectToDatabase();

    // Get pending transaction to get the correct amount
    const pendingTransaction = await PendingTransaction.findOne({ 
      orderId, 
      userId, 
      status: 'pending' 
    });
    
    console.log('Pending transaction found:', !!pendingTransaction);
    console.log('Pending transaction details:', pendingTransaction ? {
      amount: pendingTransaction.amount,
      planType: pendingTransaction.planType,
      description: pendingTransaction.description
    } : 'null');

    if (!pendingTransaction) {
      return NextResponse.json({ 
        error: 'Pending transaction not found or already processed' 
      }, { status: 400 });
    }

    // Get or create subscription first
    let subscription = await Subscription.findOne({ userId, isActive: true });
    console.log('Existing subscription found:', !!subscription);
    console.log('Current creditBalance:', subscription?.creditBalance);

    // Check if this order was already processed
    const existingCredit = await Credit.findOne({ relatedOrderId: orderId });
    if (existingCredit) {
      logger.info('PAYPAL_DUPLICATE_PREVENTED', 'Duplicate payment capture prevented', {
        userId,
        orderId,
        existingCreditId: existingCredit._id
      });
      
      return NextResponse.json({
        success: true,
        message: 'Credits already added to your account',
        creditBalance: subscription?.creditBalance || 0,
        alreadyProcessed: true
      });
    }

    // Try to capture the payment
    let captureResult;
    try {
      captureResult = await paypalService.capturePayment(orderId);
      
      if (captureResult.status !== 'COMPLETED') {
        throw new Error('Payment capture failed');
      }
    } catch (error: any) {
      // If order already captured, get the order details instead
      if (error.message?.includes('ORDER_ALREADY_CAPTURED')) {
        try {
          const orderDetails = await paypalService.getOrderDetails(orderId);
          if (orderDetails.status === 'COMPLETED') {
            captureResult = orderDetails;
            logger.info('PAYPAL_ORDER_ALREADY_CAPTURED', 'Order was already captured, using existing details', {
              userId,
              orderId
            });
          } else {
            throw new Error('Order not completed');
          }
        } catch (getOrderError) {
          throw new Error('Payment verification failed');
        }
      } else {
        throw error;
      }
    }
    
    // Use pending transaction details (this is the source of truth)
    const actualAmount = pendingTransaction.amount;
    const actualPlanType = pendingTransaction.planType;
    const actualDescription = pendingTransaction.description;

    if (!subscription) {
      // Create new subscription for PAYG
      subscription = new Subscription({
        userId,
        planType: planType || 'payg',
        planName: planType === 'payg' ? 'Pay-as-you-go' : 'Credit Top-up',
        monthlyPrice: 0, // No monthly fee for PAYG
        monthlyMinuteLimit: -1, // Unlimited with credits
        assistantLimit: -1, // Unlimited with credits
        creditBalance: 0,
        isActive: true,
        isTrial: false
      });
    } else if (subscription.planType === 'trial') {
      // Upgrade trial users to PAYG when they make their first payment
      subscription.planType = 'payg';
      subscription.planName = 'Pay-as-you-go';
      subscription.monthlyPrice = 0;
      subscription.monthlyMinuteLimit = -1; // Unlimited with credits
      subscription.monthlyCallLimit = -1; // Remove call limit for PAYG
      subscription.assistantLimit = -1; // Unlimited with credits
      subscription.isTrial = false;
      subscription.trialEndsAt = undefined;
      subscription.isActive = true; // Activate the subscription
      
      logger.info('TRIAL_UPGRADED_TO_PAYG', 'Trial user upgraded to PAYG after payment', {
        userId,
        orderId,
        amount: actualAmount
      });
    } else if (subscription.planType === 'payg' && !subscription.isActive) {
      // Activate PAYG plan after first payment
      subscription.isActive = true;
      
      logger.info('PAYG_ACTIVATED', 'PAYG plan activated after payment', {
        userId,
        orderId,
        amount: actualAmount
      });
    }

    const balanceBefore = subscription.creditBalance || 0;
    
    console.log('Using pending transaction details:', {
      amount: actualAmount,
      planType: actualPlanType,
      description: actualDescription
    });

    // Add credits to account (full amount, no auto-deduction)
    const oldBalance = subscription.creditBalance || 0;
    const amountToAdd = actualAmount;
    subscription.creditBalance = oldBalance + amountToAdd;
    console.log('Balance update:', { oldBalance, amount: amountToAdd, newBalance: subscription.creditBalance });

    // Force the field to be marked as modified to ensure it saves
    subscription.markModified('creditBalance');
    await subscription.save();
    console.log('Subscription saved successfully');
    
    // Mark pending transaction as completed
    pendingTransaction.status = 'completed';
    pendingTransaction.completedAt = new Date();
    await pendingTransaction.save();
    console.log('Pending transaction marked as completed');
    
    // Verify the save worked
    const verifySubscription = await Subscription.findOne({ userId, isActive: true });
    console.log('Verified balance after save:', verifySubscription.creditBalance);
    
    // Verify the save worked by logging
    logger.info('PAYPAL_SUBSCRIPTION_UPDATED', 'Subscription creditBalance updated', {
      userId,
      balanceBefore,
      balanceAfter: subscription.creditBalance,
      orderId
    });

    // Record credit transaction for auditing - with stronger duplicate protection
    try {
      // Double-check for duplicates right before creating the credit record
      const duplicateCheck = await Credit.findOne({ relatedOrderId: orderId });
      if (duplicateCheck) {
        logger.warn('CREDIT_DUPLICATE_DETECTED', 'Duplicate credit detected during creation', {
          userId,
          orderId,
          duplicateId: duplicateCheck._id
        });
      } else {
        await Credit.createTopup(
          userId,
          actualAmount,
          actualDescription,
          orderId,
          balanceBefore
        );
        
        logger.info('CREDIT_TRANSACTION_LOGGED', 'Credit transaction recorded successfully', {
          userId,
          orderId,
          amount: actualAmount
        });
      }
    } catch (creditError) {
      // If it's a duplicate key error (E11000), that's expected due to race condition
      if (creditError.code === 11000) {
        logger.info('CREDIT_DUPLICATE_PREVENTED', 'Duplicate credit transaction prevented by unique constraint', { 
          userId,
          orderId 
        });
      } else {
        // Other errors are unexpected but shouldn't fail the payment
        logger.error('CREDIT_LOG_ERROR', 'Failed to log credit transaction', { 
          userId,
          orderId,
          creditError: creditError instanceof Error ? creditError.message : 'Unknown error'
        });
      }
    }

    logger.info('PAYPAL_CREDITS_ADDED', 'Credits added to account', {
      userId,
      data: {
        orderId,
        amount: actualAmount,
        balanceBefore,
        balanceAfter: subscription.creditBalance,
        planType: actualPlanType
      }
    });

    return NextResponse.json({
      success: true,
      message: actualPlanType === 'payg' 
        ? `Pay-as-you-go activated! $${subscription.creditBalance.toFixed(2)} available for assistants and calls.`
        : `$${actualAmount.toFixed(2)} credits added to your account`,
      creditBalance: subscription.creditBalance,
      captureId: captureResult.purchase_units[0]?.payments?.captures?.[0]?.id
    });

  } catch (error) {
    console.error('PayPal capture error:', error);
    logger.error('PAYPAL_CAPTURE_ERROR', 'Failed to capture PayPal payment', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process payment' 
      },
      { status: 500 }
    );
  }
}