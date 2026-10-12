import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { assistantTimezone, callingRulesOf, validateCallingHours } from '@/lib/callingRules';
import Assistant from '@/models/Assistant';

/**
 * When and how often an assistant's leads are called.
 *
 * Kept apart from the assistant's main update on purpose: these rules live
 * only in Laycal, so saving them never touches what the assistant says on a
 * call or its configuration at the phone system.
 */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { accountId, account } = await getAccountAuth();
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await ctx.params;
    await connectToDatabase();
    const assistant = await Assistant.findOne({ _id: id, accountId }).lean<any>();
    if (!assistant) return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });

    return NextResponse.json({ rules: callingRulesOf(assistant), timezone: assistantTimezone(assistant, account?.timezone) });
  } catch (error) {
    logger.error('CALLING_RULES_GET_ERROR', 'Failed to load calling rules', { error });
    return NextResponse.json({ error: 'Failed to load calling rules' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { accountId } = await getAccountAuth();
    if (!accountId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await ctx.params;
    const body = await request.json();

    const callFrom = String(body.callFrom || '');
    const callUntil = String(body.callUntil || '');
    const holdOutsideHours = body.holdOutsideHours === true;
    const maxCalls = Number(body.maxCalls);

    if (![1, 2, 3].includes(maxCalls)) {
      return NextResponse.json({ error: 'Choose 1, 2 or 3 calls.' }, { status: 400 });
    }
    const hoursError = validateCallingHours(callFrom, callUntil);
    if (hoursError) return NextResponse.json({ error: hoursError }, { status: 400 });

    await connectToDatabase();
    const result = await Assistant.updateOne(
      { _id: id, accountId },
      { $set: { callingRules: { retry: body.retry !== false, maxCalls, holdOutsideHours, callFrom, callUntil }, updatedAt: new Date() } }
    );
    if (result.matchedCount !== 1) return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });

    logger.info('CALLING_RULES_SAVED', 'Calling rules saved', { accountId, data: { assistantId: id, holdOutsideHours, maxCalls } });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('CALLING_RULES_SAVE_ERROR', 'Failed to save calling rules', { error });
    return NextResponse.json({ error: 'Failed to save calling rules' }, { status: 500 });
  }
}
