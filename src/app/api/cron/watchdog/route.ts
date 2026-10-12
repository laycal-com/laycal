import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { checkHeartbeat, isCronRequest } from '@/lib/cron';

export const dynamic = 'force-dynamic';

/**
 * Vercel's own daily job (see vercel.json), independent of the outside
 * scheduler it checks on. Vercel sends the cron secret itself.
 */
export async function GET(req: NextRequest) {
  if (!isCronRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const state = await checkHeartbeat();
    return NextResponse.json(state, { status: state.ok ? 200 : 503 });
  } catch (error) {
    logger.error('CRON_WATCHDOG_ERROR', 'The watchdog failed', { error });
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
