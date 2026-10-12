import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { isCronRequest, recordHeartbeat } from '@/lib/cron';
import { reconcileStuckCalls, runDueCalls } from '@/lib/leadCalls';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Runs every minute, called by the outside scheduler with the cron secret.
 * Calls the leads whose time has come and resolves calls that never reported
 * back. Safe to fire twice at once: each lead is claimed atomically.
 */
async function handle(req: NextRequest) {
  if (!isCronRequest(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await recordHeartbeat();
    const due = await runDueCalls();
    const stuck = await reconcileStuckCalls();
    return NextResponse.json({ ok: true, ...due, ...stuck });
  } catch (error) {
    logger.error('CRON_TICK_ERROR', 'The wake-up failed', { error });
    return NextResponse.json({ ok: false, error: 'Tick failed' }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
