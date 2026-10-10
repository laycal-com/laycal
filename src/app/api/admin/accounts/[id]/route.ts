import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { applyMovement } from '@/lib/billing';
import Account from '@/models/Account';
import CreditLedger from '@/models/CreditLedger';
import { logger } from '@/lib/logger';

/** Account detail with its recent ledger. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await AdminAuthService.requireAuth(request);
  if ('error' in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

  const { id } = await params;
  await connectToDatabase();
  const account = await Account.findById(id).lean();
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  const ledger = await CreditLedger.find({ accountId: id }).sort({ createdAt: -1 }).limit(25).lean();
  return NextResponse.json({ account, ledger });
}

/**
 * Admin changes to one account: its per-minute rate, its status, or a credit
 * adjustment (positive to grant, negative to take back).
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authResult = await AdminAuthService.requireAuth(request);
    if ('error' in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const { id } = await params;
    const body = await request.json();
    await connectToDatabase();

    const account = await Account.findById(id);
    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    if ('ratePerMinute' in body) {
      const rate = body.ratePerMinute === '' || body.ratePerMinute == null ? null : Number(body.ratePerMinute);
      if (rate !== null && (!Number.isFinite(rate) || rate < 0)) {
        return NextResponse.json({ error: 'Rate must be zero or more' }, { status: 400 });
      }
      // Applies to calls charged from now on; past ledger rows keep the rate they were charged at.
      account.ratePerMinute = rate;
    }

    if ('status' in body) {
      if (!['active', 'suspended'].includes(body.status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      if (account.status !== 'invited') account.status = body.status;
    }

    await account.save();

    if ('credits' in body) {
      const amount = Number(body.credits);
      if (!Number.isFinite(amount) || amount === 0) return NextResponse.json({ error: 'Enter a non-zero amount' }, { status: 400 });
      await applyMovement({
        accountId: id,
        type: amount > 0 ? 'admin_grant' : 'admin_debit',
        amount,
        description: String(body.reason || '').trim().slice(0, 200) || (amount > 0 ? 'Credits added by admin' : 'Credits removed by admin'),
        meta: { adminId: authResult.admin?.adminId },
      });
    }

    const fresh = await Account.findById(id).lean();
    logger.info('ADMIN_ACCOUNT_UPDATED', 'Account updated by admin', { accountId: id, data: { fields: Object.keys(body) } });
    return NextResponse.json({ success: true, account: fresh });
  } catch (error) {
    logger.error('ADMIN_ACCOUNT_UPDATE_ERROR', 'Failed to update account', { error });
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}
