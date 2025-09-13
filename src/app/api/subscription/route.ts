import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { usageValidator } from '@/lib/usageValidator';
import { logger } from '@/lib/logger';
import { ensureUserExists } from '@/lib/userRegistration';

// GET - Get current subscription details and usage
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    // Ensure user exists in database (fallback mechanism)
    await ensureUserExists(userId);

    const usage = await usageValidator.getCurrentUsage(userId);
    const upgradeOptions = await usageValidator.getUpgradeOptions(userId);

    return NextResponse.json({
      success: true,
      subscription: usage,
      upgradeOptions
    });

  } catch (error) {
    logger.error('SUBSCRIPTION_GET_ERROR', 'Failed to get subscription details', {
      error
    });
    return NextResponse.json({
      error: 'Failed to get subscription details',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Create or upgrade subscription
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planType, paypalSubscriptionId } = await request.json();

    if (!planType || planType !== 'payg') {
      return NextResponse.json({
        error: 'Invalid plan type - only pay-as-you-go is supported',
        validPlans: ['payg']
      }, { status: 400 });
    }

    await connectToDatabase();
    
    // Ensure user exists in database (fallback mechanism)
    await ensureUserExists(userId);

    // Get plan details
    const planDetails = Subscription.getPlanDetails(planType);
    if (!planDetails) {
      return NextResponse.json({ error: 'Plan details not found' }, { status: 400 });
    }

    // Check for existing subscription
    let subscription = await Subscription.findOne({ userId, isActive: true });

    if (subscription) {
      // Update existing subscription
      const oldPlan = subscription.planType;
      subscription.planType = planType;
      subscription.planName = `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`;
      subscription.monthlyPrice = planDetails.price;
      subscription.monthlyMinuteLimit = planDetails.minuteLimit;
      subscription.assistantLimit = planDetails.assistantLimit;
      subscription.paypalSubscriptionId = paypalSubscriptionId;
      subscription.isTrial = false;
      subscription.trialEndsAt = undefined;

      // Reset billing period for plan changes
      if (oldPlan !== planType) {
        subscription.resetBillingPeriod();
      }

      await subscription.save();

      logger.info('SUBSCRIPTION_UPGRADED', 'Subscription upgraded successfully', {
        userId,
        oldPlan,
        newPlan: planType,
        subscriptionId: subscription._id
      });
    } else {
      // Create new subscription
      subscription = new Subscription({
        userId,
        planType,
        planName: `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`,
        monthlyPrice: planDetails.price,
        monthlyMinuteLimit: planDetails.minuteLimit,
        assistantLimit: planDetails.assistantLimit,
        paypalSubscriptionId,
        isActive: true,
        isTrial: false
      });

      await subscription.save();

      logger.info('SUBSCRIPTION_CREATED', 'New subscription created', {
        userId,
        planType,
        subscriptionId: subscription._id
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: {
        planType: subscription.planType,
        planName: subscription.planName,
        monthlyPrice: subscription.monthlyPrice,
        minuteLimit: subscription.getTotalMinuteLimit(),
        assistantLimit: subscription.getTotalAssistantLimit()
      }
    });

  } catch (error) {
    logger.error('SUBSCRIPTION_UPDATE_ERROR', 'Failed to update subscription', {
      error
    });
    return NextResponse.json({
      error: 'Failed to update subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// PUT - Add extra minutes or assistants
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { extraMinutes, extraAssistants } = await request.json();

    if ((!extraMinutes || extraMinutes < 0) && (!extraAssistants || extraAssistants < 0)) {
      return NextResponse.json({
        error: 'Invalid add-on quantities',
        details: 'extraMinutes and extraAssistants must be positive numbers'
      }, { status: 400 });
    }

    await connectToDatabase();

    const subscription = await Subscription.findOne({ userId, isActive: true });
    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Add to existing extras
    if (extraMinutes > 0) {
      subscription.extraMinutes += extraMinutes;
    }
    if (extraAssistants > 0) {
      subscription.extraAssistants += extraAssistants;
    }

    await subscription.save();

    logger.info('SUBSCRIPTION_ADDONS_ADDED', 'Add-ons purchased successfully', {
      userId,
      extraMinutes: extraMinutes || 0,
      extraAssistants: extraAssistants || 0,
      totalExtraMinutes: subscription.extraMinutes,
      totalExtraAssistants: subscription.extraAssistants
    });

    return NextResponse.json({
      success: true,
      message: 'Add-ons added successfully',
      subscription: {
        planType: subscription.planType,
        totalMinuteLimit: subscription.getTotalMinuteLimit(),
        totalAssistantLimit: subscription.getTotalAssistantLimit(),
        extraMinutes: subscription.extraMinutes,
        extraAssistants: subscription.extraAssistants
      }
    });

  } catch (error) {
    logger.error('SUBSCRIPTION_ADDONS_ERROR', 'Failed to add subscription add-ons', {
      error
    });
    return NextResponse.json({
      error: 'Failed to add subscription add-ons',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE - Cancel subscription
export async function DELETE() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const subscription = await Subscription.findOne({ userId, isActive: true });
    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    subscription.isActive = false;
    subscription.cancelledAt = new Date();
    await subscription.save();

    logger.info('SUBSCRIPTION_CANCELLED', 'Subscription cancelled successfully', {
      userId,
      subscriptionId: subscription._id,
      planType: subscription.planType
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });

  } catch (error) {
    logger.error('SUBSCRIPTION_CANCEL_ERROR', 'Failed to cancel subscription', {
      error
    });
    return NextResponse.json({
      error: 'Failed to cancel subscription',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}