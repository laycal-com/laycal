import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { logger } from '@/lib/logger';
import { stopLeadCalls } from '@/lib/leadCalls';

/** Stop calling a lead that is waiting for its next call. */
export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { accountId } = await getAccountAuth();
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await ctx.params;
    const stopped = await stopLeadCalls(id, accountId);
    if (!stopped) return NextResponse.json({ error: 'This lead is not waiting for a call.' }, { status: 400 });

    logger.info('LEAD_STOPPED', 'Client stopped calls to a lead', { accountId, leadId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('LEAD_STOP_ERROR', 'Stop request failed', { error });
    return NextResponse.json({ error: 'Failed to stop calling this lead' }, { status: 500 });
  }
}
