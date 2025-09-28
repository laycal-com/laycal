import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planType } = await request.json();

    if (!planType || !['trial', 'payg'].includes(planType)) {
      return NextResponse.json({ 
        error: 'Invalid plan type. Must be "trial" or "payg"' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Find existing subscription (should be placeholder)
    const subscription = await Subscription.findOne({ userId });
    
    if (!subscription) {
      return NextResponse.json({ 
        error: 'User subscription not found' 
      }, { status: 404 });
    }

    if (subscription.planType !== 'none') {
      return NextResponse.json({ 
        error: 'User already has an active plan' 
      }, { status: 400 });
    }

    if (planType === 'trial') {
      // Set up free trial
      const trialStart = new Date();
      const trialEnd = new Date(trialStart.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      subscription.planType = 'trial';
      subscription.planName = 'Free Trial';
      subscription.monthlyPrice = 0;
      
      // Trial limits: 1 assistant + 5 calls
      subscription.monthlyMinuteLimit = -1; // Unlimited minutes for trial
      subscription.monthlyCallLimit = 5; // 5 calls limit for trial users
      subscription.assistantLimit = 1;
      
      // Trial period
      subscription.currentPeriodStart = trialStart;
      subscription.currentPeriodEnd = trialEnd;
      subscription.isTrial = true;
      subscription.trialEndsAt = trialEnd;
      
      // Reset usage tracking
      subscription.minutesUsed = 0;
      subscription.assistantsCreated = 0;
      subscription.callsUsed = 0;
      
      // No credits for trial
      subscription.creditBalance = 0;
      subscription.autoTopupEnabled = false;
      
      subscription.isActive = true;

      await subscription.save();

      logger.info('TRIAL_PLAN_SELECTED', 'User selected free trial plan', {
        userId,
        subscriptionId: subscription._id.toString(),
        trialEndsAt: trialEnd
      });

      return NextResponse.json({
        success: true,
        message: 'Free trial activated successfully',
        planType: 'trial'
      });

    } else if (planType === 'payg') {
      // Set up PAYG plan (will be activated after payment)
      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date(currentPeriodStart.getFullYear(), currentPeriodStart.getMonth() + 1, currentPeriodStart.getDate());

      subscription.planType = 'payg';
      subscription.planName = 'Pay-as-you-go';
      subscription.monthlyPrice = 0; // No monthly fee for PAYG
      
      // PAYG limits (unlimited with credits)
      subscription.monthlyMinuteLimit = -1; // Unlimited minutes
      subscription.monthlyCallLimit = -1; // Unlimited calls
      subscription.assistantLimit = -1; // Unlimited assistants
      
      // Current period
      subscription.currentPeriodStart = currentPeriodStart;
      subscription.currentPeriodEnd = currentPeriodEnd;
      subscription.isTrial = false;
      subscription.trialEndsAt = undefined;
      
      // Reset usage tracking
      subscription.minutesUsed = 0;
      subscription.assistantsCreated = 0;
      subscription.callsUsed = 0;
      
      // Start with no credits (will be added after payment)
      subscription.creditBalance = 0;
      subscription.autoTopupEnabled = false;
      
      // Will be activated after successful payment
      subscription.isActive = false;

      await subscription.save();

      logger.info('PAYG_PLAN_SELECTED', 'User selected PAYG plan, awaiting payment', {
        userId,
        subscriptionId: subscription._id.toString()
      });

      return NextResponse.json({
        success: true,
        message: 'PAYG plan setup completed, awaiting payment',
        planType: 'payg'
      });
    }

  } catch (error) {
    console.error('Plan selection error:', error);
    logger.error('PLAN_SELECTION_ERROR', 'Failed to set user plan', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to select plan' 
      },
      { status: 500 }
    );
  }
}