import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Assistant from '@/models/Assistant';
import IntakeGuard from '@/models/IntakeGuard';
import { callOrHold } from '@/lib/leadCalls';
import { logger } from '@/lib/logger';
import { validatePhoneNumber, normalizePhoneNumber } from '@/lib/csvProcessor';
import { getVertical } from '@/lib/speedToLead/verticals';
import { rateLimit } from '@/lib/speedToLead/vapiToolBridge';

/**
 * Speed-to-lead intake.
 *
 * One endpoint per assistant, handed to the customer to wire into their Google
 * Form or their own website form. A submission creates the lead and dials
 * immediately — the whole product promise is the gap between this POST and the
 * phone ringing.
 *
 * Public by necessity (a website form posts here with no session), so it is
 * rate limited per assistant and validates the assistant id before doing work.
 */

const MAX_RETRIES = 3;
/** A repeat of the same number to the same assistant inside this window is the same request. */
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

const guardKey = (assistantId: string, phone: string) => `${assistantId}:${phone}`;

/**
 * Returns the earlier lead's id when this submission repeats one (an empty
 * string when that lead is not saved yet), or null when it is a new request.
 *
 * Two checks, because they catch different cases. The lead lookup covers a
 * repeat while the first lead is still being called or is waiting for a call,
 * however long ago it arrived. The guard row covers two requests landing in the
 * same instant, before either has saved a lead for the other to find.
 */
async function findDuplicate(assistantId: string, phone: string): Promise<string | null> {
  const since = new Date(Date.now() - DUPLICATE_WINDOW_MS);
  const existing = await Lead.findOne({
    assignedAssistantId: assistantId,
    phoneNumber: phone,
    $or: [
      { createdAt: { $gte: since } },
      { status: 'calling' },
      { status: 'pending', nextCallAt: { $ne: null } },
    ],
  })
    .sort({ createdAt: -1 })
    .select('_id')
    .lean<{ _id: unknown }>();
  if (existing) return String(existing._id);

  const key = guardKey(assistantId, phone);
  try {
    await IntakeGuard.create({ key, expireAt: new Date(Date.now() + DUPLICATE_WINDOW_MS) });
    return null;
  } catch (error: any) {
    if (error?.code !== 11000) throw error;
  }

  // A guard row exists but no lead matched above. Either its lead is finished
  // and old (the row has outlived its ten minutes: the database clears expired
  // rows about once a minute), or another request is creating the lead now.
  const guard = await IntakeGuard.findOne({ key }).lean<{ leadId?: string; expireAt: Date }>();
  if (guard && guard.expireAt.getTime() > Date.now()) return guard.leadId || '';
  await IntakeGuard.updateOne({ key }, { $set: { expireAt: new Date(Date.now() + DUPLICATE_WINDOW_MS) }, $unset: { leadId: 1 } }, { upsert: true });
  return null;
}
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

/** Accepts several spellings so customers can map their own form fields loosely. */
function pick(body: Record<string, any>, ...keys: string[]): string {
  for (const key of keys) {
    const found = Object.keys(body).find((k) => k.toLowerCase().replace(/[\s_-]/g, '') === key);
    if (found && body[found] != null && String(body[found]).trim()) {
      return String(body[found]).trim();
    }
  }
  return '';
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ assistantId: string }> }) {
  const { assistantId } = await ctx.params;

  try {
    if (!rateLimit(`intake:${assistantId}`, RATE_LIMIT, RATE_WINDOW_MS)) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
    }

    if (!mongoose.Types.ObjectId.isValid(assistantId)) {
      return NextResponse.json({ error: 'Unknown assistant' }, { status: 404 });
    }

    const body = await req.json();

    const firstName = pick(body, 'firstname', 'first');
    const lastName = pick(body, 'lastname', 'last');
    const email = pick(body, 'email', 'emailaddress');
    const phone = pick(body, 'phone', 'phonenumber', 'mobile', 'tel');
    const address = pick(body, 'address', 'serviceaddress', 'streetaddress');
    const details = pick(body, 'details', 'description', 'problem', 'message', 'about');
    const availability = pick(body, 'availability', 'preferredtime', 'besttime');
    const serviceType = pick(body, 'servicetype', 'service', 'jobtype');

    await connectToDatabase();
    const assistant = await Assistant.findOne({ _id: assistantId, isActive: true });

    if (!assistant) {
      logger.error('INTAKE_UNKNOWN_ASSISTANT', 'Intake for unknown assistant', { data: { assistantId } });
      return NextResponse.json({ error: 'Unknown assistant' }, { status: 404 });
    }

    if (!phone) {
      return NextResponse.json({ error: 'phone is required' }, { status: 400 });
    }
    if (!validatePhoneNumber(phone)) {
      logger.error('INTAKE_BAD_PHONE', 'Invalid phone on intake', {
        accountId: assistant.accountId,
        data: { assistantId, phone },
      });
      // Saved so the business sees the request on its Leads page; nobody can be called.
      await Lead.create({
        accountId: assistant.accountId,
        name: `${firstName} ${lastName}`.trim() || 'there',
        phoneNumber: phone,
        email: email || null,
        address: address || null,
        details: details || null,
        notes: details || null,
        status: 'failed',
        outcome: 'invalid_number',
        source: 'form',
        assignedAssistantId: assistant._id,
      });
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phone);
    const fullName = `${firstName} ${lastName}`.trim() || 'there';
    const cfg = assistant.serviceConfig;
    const resolvedService =
      serviceType || (cfg?.vertical ? getVertical(cfg.vertical).label : '') || 'service';

    // The same form sent twice (a double click, or the form retrying after an
    // error) must be one lead and one call. The form still gets a success.
    const duplicateOf = await findDuplicate(assistant._id.toString(), normalizedPhone);
    if (duplicateOf !== null) {
      logger.info('INTAKE_DUPLICATE', 'Repeated submission ignored', {
        accountId: assistant.accountId,
        data: { assistantId, leadId: duplicateOf || undefined },
      });
      return NextResponse.json(
        { success: true, duplicate: true, ...(duplicateOf && { leadId: duplicateOf }) },
        { status: 200 }
      );
    }

    const lead = new Lead({
      accountId: assistant.accountId,
      name: fullName,
      phoneNumber: normalizedPhone,
      email: email || null,
      address: address || null,
      details: details || null,
      availability: availability || null,
      serviceType: resolvedService,
      notes: details || null,
      status: 'pending',
      source: 'form',
      assignedAssistantId: assistant._id,
    });
    await lead.save();
    await IntakeGuard.updateOne({ key: guardKey(assistant._id.toString(), normalizedPhone) }, { $set: { leadId: lead._id.toString() } });

    logger.info('INTAKE_LEAD_CREATED', 'Speed-to-lead intake received', {
      accountId: assistant.accountId,
      leadId: lead._id.toString(),
      data: { assistantId, service: resolvedService, hasAddress: !!address },
    });

    // A transient failure reaching the phone system is retried; an empty
    // balance or a bad number is not, since trying again cannot help.
    const result = await callOrHold(lead, assistant, { transientRetries: MAX_RETRIES });
    const leadId = lead._id.toString();

    if (result.ok && 'held' in result) {
      // Outside the assistant's calling hours: the lead waits and is called when they open.
      return NextResponse.json({ success: true, leadId, held: true, callAt: result.callAt.toISOString() }, { status: 200 });
    }

    if (result.ok) {
      return NextResponse.json({ success: true, leadId, callId: result.callId }, { status: 200 });
    }

    if (result.code === 'no_credits') {
      // Not a server error: the request was understood and the lead is saved,
      // but the account's balance is empty, so nobody was called.
      return NextResponse.json(
        {
          success: false,
          leadId,
          code: 'no_credits',
          error: 'The Laycal balance is empty, so this lead was not called. Add credits and calls start again.',
        },
        { status: 402 }
      );
    }

    if (result.code === 'invalid_number') {
      return NextResponse.json(
        { success: false, leadId, code: 'invalid_number', error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, leadId, code: result.code, error: 'Could not start the call' },
      { status: 500 }
    );
  } catch (error) {
    logger.error('INTAKE_ERROR', 'Speed-to-lead intake failed', { error, data: { assistantId } });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
