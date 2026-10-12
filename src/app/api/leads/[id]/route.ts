import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { callingRulesOf } from '@/lib/callingRules';
import Lead from '@/models/Lead';
import Assistant from '@/models/Assistant';

/** One lead of the signed-in account: where it stands and each call placed to it. */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { accountId } = await getAccountAuth();
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await ctx.params;
    await connectToDatabase();

    const lead = await Lead.findOne({ _id: id, accountId })
      .select('name phoneNumber status outcome tries attempts nextCallAt callResults.answered assignedAssistantId source createdAt')
      .lean<any>()
      .catch(() => null);
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const assistant = lead.assignedAssistantId
      ? await Assistant.findOne({ _id: lead.assignedAssistantId, accountId }).select('name callingRules').lean<any>()
      : null;

    return NextResponse.json({
      lead: {
        _id: String(lead._id),
        name: lead.name,
        phoneNumber: lead.phoneNumber,
        status: lead.status,
        outcome: lead.outcome ?? null,
        tries: lead.tries ?? 0,
        maxCalls: callingRulesOf(assistant).maxCalls,
        nextCallAt: lead.nextCallAt ?? null,
        callResults: lead.callResults ? { answered: lead.callResults.answered ?? null } : null,
        attempts: (lead.attempts || []).map((a: any) => ({
          startedAt: a.startedAt,
          endedAt: a.endedAt ?? null,
          result: a.result ?? null,
        })),
        assistantName: assistant?.name ?? null,
        createdAt: lead.createdAt,
      },
    });
  } catch (error) {
    logger.error('LEAD_GET_ERROR', 'Failed to load lead', { error });
    return NextResponse.json({ error: 'Failed to load lead' }, { status: 500 });
  }
}
