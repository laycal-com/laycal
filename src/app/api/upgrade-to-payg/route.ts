import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    // Find existing subscription
    const subscription = await Subscription.findOne({ userId, isActive: true });
    
    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
    }

    // Check if user has credits (indicating they paid)
    if (subscription.creditBalance <= 0) {
      return NextResponse.json({ 
        error: 'No credits found. Add credits first to upgrade to PAYG.' 
      }, { status: 400 });
    }

    // Upgrade to PAYG
    const wasTrialBefore = subscription.planType === 'trial';
    subscription.planType = 'payg';
    subscription.planName = 'Pay-as-you-go';
    subscription.monthlyPrice = 0;
    subscription.monthlyMinuteLimit = -1; // Unlimited with credits
    subscription.monthlyCallLimit = -1; // Remove call limit for PAYG
    subscription.assistantLimit = -1; // Unlimited with credits
    subscription.isTrial = false;
    subscription.trialEndsAt = undefined;
    
    await subscription.save();
    
    logger.info('MANUAL_UPGRADE_TO_PAYG', 'User manually upgraded to PAYG', {
      userId,
      wasTrialBefore,
      creditBalance: subscription.creditBalance
    });
    
    return NextResponse.json({
      success: true,
      message: 'Successfully upgraded to Pay-as-you-go!',
      subscription: {
        planType: subscription.planType,
        planName: subscription.planName,
        creditBalance: subscription.creditBalance,
        monthlyMinuteLimit: subscription.monthlyMinuteLimit,
        assistantLimit: subscription.assistantLimit
      }
    });

  } catch (error) {
    logger.error('UPGRADE_TO_PAYG_ERROR', 'Failed to upgrade to PAYG', { error });
    return NextResponse.json({
      error: 'Failed to upgrade to PAYG',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}