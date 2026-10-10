import { NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import CreditLedger from '@/models/CreditLedger';
import { PricingService } from '@/lib/pricing';
import { logger } from '@/lib/logger';

/** Balance and recent ledger entries for the signed-in account. */
export async function GET() {
  try {
    const { accountId, account } = await getAccountAuth();
    if (!accountId || !account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const [entries, pricing] = await Promise.all([
      CreditLedger.find({ accountId }).sort({ createdAt: -1 }).limit(10).lean(),
      PricingService.getPricing(),
    ]);

    const minimumBalance = pricing.minimum_topup_amount || 5;

    return NextResponse.json({
      balance: account.creditBalance,
      planType: 'payg',
      needsTopup: account.creditBalance <= minimumBalance,
      minimumBalance,
      recentTransactions: entries.map((e: any) => ({
        type: e.type,
        amount: e.amount,
        description: e.description,
        date: e.createdAt,
      })),
    });
  } catch (error) {
    logger.error('CREDITS_GET_ERROR', 'Failed to load credits', { error });
    return NextResponse.json({ error: 'Failed to load credits' }, { status: 500 });
  }
}
