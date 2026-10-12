import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { logger } from '@/lib/logger';

const KINDS = ['booked', 'unreached', 'stopped', 'low'] as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Email notification settings for the signed-in account. Absent settings read as: all on, sent to the account's own address. */
export async function GET() {
  try {
    const { accountId, account } = await getAccountAuth();
    if (!accountId || !account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const n = account.notifications || {};
    return NextResponse.json({
      email: n.email || account.email,
      booked: n.booked !== false,
      unreached: n.unreached !== false,
      stopped: n.stopped !== false,
      low: n.low !== false,
    });
  } catch (error) {
    logger.error('NOTIFICATIONS_GET_ERROR', 'Failed to load notification settings', { error });
    return NextResponse.json({ error: 'Failed to load notification settings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { accountId, account } = await getAccountAuth();
    if (!accountId || !account) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    // One address only: a list would slip past as a single odd-looking one.
    if (!EMAIL.test(email) || /[,;]/.test(email) || email.length > 200) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    account.notifications = {
      email,
      ...Object.fromEntries(KINDS.map((k) => [k, body[k] !== false])),
    };
    await account.save();

    logger.info('NOTIFICATIONS_SAVED', 'Notification settings saved', { accountId });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('NOTIFICATIONS_SAVE_ERROR', 'Failed to save notification settings', { error });
    return NextResponse.json({ error: 'Failed to save notification settings' }, { status: 500 });
  }
}
