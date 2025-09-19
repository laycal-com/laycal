import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import Credit from '@/models/Credit';
import { PricingService } from '@/lib/pricing';
import { logger } from '@/lib/logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const authResult = await AdminAuthService.requirePermission(request, 'manage_users');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { admin } = authResult;
    const { amount, description } = await request.json();

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ 
        error: 'Valid amount is required' 
      }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user already has an active subscription
    let subscription = await Subscription.findOne({ userId, isActive: true });
    
    if (subscription) {
      // User already activated - just add credits
      const oldBalance = subscription.creditBalance || 0;
      subscription.creditBalance = oldBalance + amount;
      subscription.markModified('creditBalance');
      await subscription.save();

      // Log the credit addition
      await Credit.createTopup(
        userId,
        amount,
        description || `Admin activation: $${amount} credit added`,
        `admin-${admin._id.toString()}-${Date.now()}`,
        oldBalance
      );

      logger.info('ADMIN_USER_CREDIT_ADDED', 'Credits added to existing user account', {
        adminId: admin._id.toString(),
        adminEmail: admin.email,
        userId,
        amount,
        newBalance: subscription.creditBalance,
        description
      });

      return NextResponse.json({
        success: true,
        message: `$${amount} credits added to user account`,
        subscription: {
          planType: subscription.planType,
          creditBalance: subscription.creditBalance,
          isActive: subscription.isActive
        }
      });
    }

    // Check for existing inactive subscription to copy metadata
    const inactiveSubscription = await Subscription.findOne({ userId, isActive: false });
    
    // Create new PAYG subscription for user
    const pricing = await PricingService.getPricing();
    
    subscription = new Subscription({
      userId,
      planType: 'payg',
      planName: 'Pay-as-you-go',
      monthlyPrice: 0, // No monthly fee for PAYG
      monthlyMinuteLimit: -1, // Unlimited with credits
      assistantLimit: -1, // Unlimited with credits
      creditBalance: amount,
      isActive: true,
      isTrial: false,
      // Copy metadata from inactive subscription if it exists
      ...(inactiveSubscription?.metadata && { metadata: inactiveSubscription.metadata })
    });

    await subscription.save();

    // Log the account activation
    await Credit.createTopup(
      userId,
      amount,
      description || `Admin activation: Account activated with $${amount} credits`,
      `admin-${admin._id.toString()}-${Date.now()}`,
      0
    );

    logger.info('ADMIN_USER_ACTIVATED', 'User account manually activated by admin', {
      adminId: admin._id.toString(),
      adminEmail: admin.email,
      userId,
      amount,
      description,
      subscriptionId: subscription._id.toString()
    });

    return NextResponse.json({
      success: true,
      message: `User account activated with $${amount} credits`,
      subscription: {
        planType: subscription.planType,
        creditBalance: subscription.creditBalance,
        isActive: subscription.isActive
      }
    });

  } catch (error) {
    logger.error('ADMIN_USER_ACTIVATE_ERROR', 'Failed to activate user account', { 
      error,
      userId: (await params).userId
    });
    
    return NextResponse.json({
      error: 'Failed to activate user account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}