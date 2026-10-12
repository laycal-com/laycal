import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { startLeadCall } from '@/lib/leadCalls';
import Lead from '@/models/Lead';

/**
 * Retry on a finished lead, and Call now on a waiting one. Both go through the
 * same call starter as every other call, so the credit check and the lead's own
 * assistant always apply.
 */
export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { accountId } = await getAccountAuth();
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await ctx.params;
    await connectToDatabase();

    const result = await startLeadCall(id, { mode: 'manual', accountId });

    if (result.ok) {
      const lead = await Lead.findOne({ _id: id, accountId }).select('status').lean<{ status: string }>();
      return NextResponse.json({
        success: true,
        message: 'Call started',
        data: { leadId: id, vapiCallId: result.callId, status: lead?.status || 'calling' },
      });
    }

    const status = { not_found: 404, in_progress: 400, no_credits: 402, invalid_number: 400, not_placed: 500 }[result.code];
    const error = result.code === 'in_progress' ? 'Cannot retry while call is in progress' : result.message;
    return NextResponse.json({ error, code: result.code, ...(result.code === 'no_credits' && { needsCredits: true }) }, { status });
  } catch (error) {
    logger.error('LEAD_RETRY_ERROR', 'Retry request failed', { error });
    return NextResponse.json({ error: 'Failed to process retry request' }, { status: 500 });
  }
}
