import { NextRequest, NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/nextjs/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import { applyMovement } from '@/lib/billing';
import { PricingService } from '@/lib/pricing';
import Account from '@/models/Account';
import Assistant from '@/models/Assistant';
import { logger } from '@/lib/logger';

/** Every account, newest first, with the figures an admin acts on. */
export async function GET(request: NextRequest) {
  try {
    const authResult = await AdminAuthService.requireAuth(request);
    if ('error' in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    await connectToDatabase();
    const search = (request.nextUrl.searchParams.get('search') || '').trim().toLowerCase();
    const all = await Account.find().sort({ createdAt: -1 }).limit(500).lean();
    // Filtered in memory on purpose: admin search text never reaches a database regex.
    const accounts = search
      ? all.filter((a: any) => `${a.name} ${a.email}`.toLowerCase().includes(search))
      : all;

    const [defaultRate, counts] = await Promise.all([
      PricingService.getPaygMinuteCost(),
      Assistant.aggregate([{ $group: { _id: '$accountId', n: { $sum: 1 } } }]),
    ]);
    const assistantCount = new Map(counts.map((c: any) => [String(c._id), c.n]));

    return NextResponse.json({
      defaultRate,
      accounts: accounts.map((a: any) => ({
        id: String(a._id),
        name: a.name,
        email: a.email,
        status: a.status,
        industry: a.industry || '',
        ratePerMinute: a.ratePerMinute,
        creditBalance: a.creditBalance,
        assistants: assistantCount.get(String(a._id)) || 0,
        onboarded: !!a.onboardedAt,
        createdAt: a.createdAt,
      })),
    });
  } catch (error) {
    logger.error('ADMIN_ACCOUNTS_LIST_ERROR', 'Failed to list accounts', { error });
    return NextResponse.json({ error: 'Failed to list accounts' }, { status: 500 });
  }
}

/**
 * Invites a customer: prepares their account (rate, starting credits) and
 * sends the Clerk invitation. When they sign up with that email the account is
 * already theirs.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await AdminAuthService.requireAuth(request);
    if ('error' in authResult) return NextResponse.json({ error: authResult.error }, { status: authResult.status });

    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const name = String(body.name || '').trim().slice(0, 120);
    const credits = Number(body.credits) || 0;
    const rate = body.ratePerMinute === '' || body.ratePerMinute == null ? null : Number(body.ratePerMinute);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    if (rate !== null && (!Number.isFinite(rate) || rate < 0)) return NextResponse.json({ error: 'Rate must be zero or more' }, { status: 400 });
    if (credits < 0) return NextResponse.json({ error: 'Starting credits cannot be negative' }, { status: 400 });

    await connectToDatabase();
    if (await Account.findOne({ email })) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const account = await Account.create({ email, name, status: 'invited', ratePerMinute: rate, createdBy: 'admin' });
    const accountId = String(account._id);

    if (credits > 0) {
      await applyMovement({
        accountId,
        type: 'admin_grant',
        amount: credits,
        description: 'Starting credits',
        meta: { adminId: authResult.admin?.adminId },
      });
    }

    let invitation: 'sent' | 'failed' = 'sent';
    let invitationError: string | undefined;
    try {
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
      await clerk.invitations.createInvitation({
        emailAddress: email,
        redirectUrl: `${appUrl}/sign-up`,
        publicMetadata: { accountId },
        ignoreExisting: true,
      });
    } catch (error: any) {
      invitation = 'failed';
      invitationError = error?.errors?.[0]?.longMessage || error?.message || 'Unknown error';
    }

    logger.info('ADMIN_ACCOUNT_INVITED', 'Account prepared for invite', { accountId, data: { invitation, credits, rate } });
    return NextResponse.json({ success: true, accountId, invitation, invitationError });
  } catch (error) {
    logger.error('ADMIN_ACCOUNT_INVITE_ERROR', 'Failed to invite account', { error });
    return NextResponse.json({ error: 'Failed to invite account' }, { status: 500 });
  }
}
