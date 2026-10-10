import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { connectToDatabase } from '@/lib/mongodb';
import { paypalService } from '@/lib/paypal';
import { applyMovement } from '@/lib/billing';
import Account from '@/models/Account';
import PendingTransaction from '@/models/PendingTransaction';
import { logger } from '@/lib/logger';

/**
 * Completes a PayPal top-up.
 *
 * The amount credited is the one stored when the order was created, never the
 * one in this request. The ledger entry is keyed on the order id, so a
 * double-click, a refresh of the return URL or a retry cannot credit twice.
 */
export async function POST(request: NextRequest) {
  try {
    const { accountId } = await getAccountAuth();
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId } = await request.json();
    if (!orderId) return NextResponse.json({ error: 'Order ID required' }, { status: 400 });

    await connectToDatabase();

    const pending = await PendingTransaction.findOne({ orderId, accountId });
    if (!pending) return NextResponse.json({ error: 'Order not found for this account' }, { status: 400 });

    let capture: any;
    try {
      capture = await paypalService.capturePayment(orderId);
      if (capture.status !== 'COMPLETED') throw new Error('Payment capture failed');
    } catch (error: any) {
      // Already captured (for example the return page was reloaded): confirm with PayPal instead.
      if (!error.message?.includes('ORDER_ALREADY_CAPTURED')) throw error;
      capture = await paypalService.getOrderDetails(orderId);
      if (capture.status !== 'COMPLETED') throw new Error('Payment verification failed');
    }

    const amount = pending.amount;
    const result = await applyMovement({
      accountId,
      type: 'topup',
      amount,
      description: `Credit top-up: $${amount.toFixed(2)}`,
      ref: `order:${orderId}`,
      meta: { orderId },
    });

    if (pending.status !== 'completed') {
      pending.status = 'completed';
      pending.completedAt = new Date();
      await pending.save();
    }

    const account = await Account.findById(accountId).select('creditBalance').lean<{ creditBalance: number }>();
    const creditBalance = account?.creditBalance ?? 0;

    logger.info('PAYPAL_CREDITS_ADDED', result.applied ? 'Credits added to account' : 'Top-up already recorded', {
      accountId,
      data: { orderId, amount, creditBalance, applied: result.applied },
    });

    return NextResponse.json({
      success: true,
      alreadyProcessed: !result.applied,
      message: result.applied ? `$${amount.toFixed(2)} in credits added to your account` : 'Credits already added to your account',
      creditBalance,
    });
  } catch (error) {
    logger.error('PAYPAL_CAPTURE_ERROR', 'Failed to capture PayPal payment', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to process payment' }, { status: 500 });
  }
}
