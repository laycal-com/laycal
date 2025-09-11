import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import AdminCreditTransaction from '@/models/AdminCreditTransaction';
import Credit from '@/models/Credit';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const authResult = await AdminAuthService.requirePermission(request, 'add_credits');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { admin } = authResult;
    const { userId, amount, reason } = await request.json();

    if (!userId || !reason || typeof amount !== 'number') {
      return NextResponse.json(
        { error: 'userId, amount, and reason are required' },
        { status: 400 }
      );
    }

    if (amount === 0) {
      return NextResponse.json(
        { error: 'Amount cannot be zero' },
        { status: 400 }
      );
    }

    // For negative amounts (removal), check if admin has remove permission
    if (amount < 0) {
      const hasRemovePermission = admin.hasPermission('remove_credits');
      if (!hasRemovePermission) {
        return NextResponse.json(
          { error: 'Insufficient permissions to remove credits' },
          { status: 403 }
        );
      }
    }

    await connectToDatabase();

    // Find or create user subscription
    let subscription = await Subscription.findOne({ userId, isActive: true });
    
    if (!subscription) {
      // Create PAYG subscription for user if they don't have one
      subscription = new Subscription({
        userId,
        planType: 'payg',
        planName: 'Pay-as-you-go',
        monthlyPrice: 0,
        monthlyMinuteLimit: -1,
        assistantLimit: -1,
        creditBalance: 0,
        isActive: true,
        isTrial: false
      });
    }

    const previousBalance = subscription.creditBalance || 0;
    const newBalance = Math.max(0, previousBalance + amount);

    // Prevent removing more credits than available
    if (amount < 0 && Math.abs(amount) > previousBalance) {
      return NextResponse.json(
        { error: `Cannot remove $${Math.abs(amount)}. User only has $${previousBalance} available.` },
        { status: 400 }
      );
    }

    // Update subscription
    subscription.creditBalance = newBalance;
    subscription.markModified('creditBalance');
    await subscription.save();

    // Log the admin transaction
    await AdminCreditTransaction.createAdminTransaction(
      userId,
      admin._id.toString(),
      admin.name,
      amount > 0 ? 'admin_add' : 'admin_remove',
      amount,
      reason,
      previousBalance,
      newBalance
    );

    // Also create a regular credit transaction for user's transaction history
    const transactionType = amount > 0 ? 'admin_credit' : 'admin_debit';
    const description = amount > 0 
      ? `Admin credit: ${reason}` 
      : `Admin debit: ${reason}`;

    try {
      if (amount > 0) {
        await Credit.createTopup(
          userId,
          amount,
          description,
          `admin-${admin._id}-${Date.now()}`,
          previousBalance
        );
      } else {
        await Credit.createUsage(
          userId,
          Math.abs(amount),
          description,
          `admin-${admin._id}-${Date.now()}`,
          previousBalance
        );
      }
    } catch (creditError) {
      // Credit logging is non-critical, continue if it fails
      logger.error('ADMIN_CREDIT_LOG_ERROR', 'Failed to log credit transaction', { 
        creditError, 
        userId, 
        amount 
      });
    }

    logger.info('ADMIN_CREDIT_ADJUSTMENT', 'Admin adjusted user credits', {
      adminId: admin._id.toString(),
      adminEmail: admin.email,
      userId,
      amount,
      reason,
      previousBalance,
      newBalance
    });

    return NextResponse.json({
      success: true,
      previousBalance,
      newBalance,
      adjustment: amount
    });

  } catch (error) {
    logger.error('ADMIN_CREDIT_ADJUSTMENT_ERROR', 'Failed to adjust user credits', { error });
    return NextResponse.json({ error: 'Failed to adjust credits' }, { status: 500 });
  }
}