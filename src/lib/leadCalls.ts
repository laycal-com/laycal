import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { canPlaceCall, chargeCall } from '@/lib/billing';
import { TenantVapiService } from '@/lib/tenantVapi';
import { buildCallVariables } from '@/lib/speedToLead/callVariables';
import { assistantTimezone, callingRulesOf, nextCallingTime, retryDelaysSeconds } from '@/lib/callingRules';
import { notifyCallsStopped, notifyUnreached } from '@/lib/notifications';
import { checkHeartbeat } from '@/lib/cron';
import Lead from '@/models/Lead';
import Assistant from '@/models/Assistant';
import Appointment from '@/models/Appointment';

/**
 * The one way a call to a lead is started, and the one place that decides what
 * happens when it ends.
 *
 * Every path that calls a lead comes through `startLeadCall`: a new form lead,
 * an uploaded list, Retry, Call now, a later try and a held night-time lead.
 * (The assistant's own test call stays separate.) That is what guarantees the
 * credit check, the right assistant, and that a lead is never on two calls.
 *
 * A lead that is waiting for a call has `status: 'pending'` and `nextCallAt`
 * set. The wake-up (`/api/cron/tick`) calls `runDueCalls` every minute.
 */

export const NOT_ANSWERED_REASONS = [
  'customer-busy',
  'customer-did-not-answer',
  'voicemail',
  'twilio-failed-to-connect-call',
  'vonage-failed-to-connect-call',
  'manually-canceled',
  'customer-did-not-give-microphone-permission',
];

export const NO_CREDITS_MESSAGE = 'No credits left. Add credits to place calls.';

type Outcome = 'no_answer' | 'no_credits' | 'not_placed' | 'invalid_number' | 'stopped';
type AttemptResult = 'answered' | 'no_answer' | 'busy' | 'voicemail' | 'not_connected';

export type StartResult =
  | { ok: true; callId: string }
  | { ok: false; code: 'no_credits' | 'not_placed' | 'invalid_number' | 'in_progress' | 'not_found'; message: string };

const MESSAGES = {
  no_credits: NO_CREDITS_MESSAGE,
  not_placed: 'The call could not be placed.',
  invalid_number: 'The phone number is not valid.',
  in_progress: 'This lead is already being called.',
  not_found: 'Lead not found.',
} as const;

/** How a finished call counts: who answered, or why nobody did. */
export function attemptResult(endedReason?: string | null): AttemptResult {
  if (endedReason === 'customer-did-not-answer') return 'no_answer';
  if (endedReason === 'customer-busy') return 'busy';
  if (endedReason === 'voicemail') return 'voicemail';
  if (endedReason && NOT_ANSWERED_REASONS.includes(endedReason)) return 'not_connected';
  return 'answered';
}

const RINGS_OUT: AttemptResult[] = ['no_answer', 'busy', 'voicemail'];

function looksLikeBadNumber(message: string): boolean {
  return /valid phone number|invalid (phone )?number|not a valid|E\.?164|customer\.number/i.test(message);
}

/** The attempts that belong to the current round, newest last. */
function roundAttempts(lead: any): any[] {
  const all = lead.attempts || [];
  const tries = Math.max(0, Number(lead.tries) || 0);
  return tries ? all.slice(-tries) : [];
}

/** Ends a lead without (another) call and records why. */
async function finish(lead: any, outcome: Outcome): Promise<void> {
  await Lead.updateOne({ _id: lead._id }, { $set: { status: 'failed', outcome, nextCallAt: null, updatedAt: new Date() } });
  lead.status = 'failed';
  lead.outcome = outcome;
  lead.nextCallAt = null;
}

/**
 * A lead has just been left waiting for the wake-up. If the wake-up has
 * stopped, this is the moment it matters, so say so now.
 */
async function noteWaiting(): Promise<void> {
  try {
    await checkHeartbeat();
  } catch (error) {
    logger.error('HEARTBEAT_CHECK_ERROR', 'Could not check the wake-up', { error });
  }
}

/* ------------------------------ starting a call ------------------------------ */

type Mode =
  /** A lead that has just arrived, or been uploaded. */
  | 'new'
  /** The wake-up found the lead's call is due. */
  | 'due'
  /** Someone pressed Retry or Call now. */
  | 'manual';

/**
 * Places a call to a lead. The claim at the top is atomic, so two requests for
 * the same lead (a double click, the wake-up firing twice) place one call.
 */
export async function startLeadCall(
  leadId: string,
  opts: { mode: Mode; accountId?: string; transientRetries?: number } = { mode: 'manual' }
): Promise<StartResult> {
  await connectToDatabase();
  const now = new Date();

  const filter: Record<string, any> = { _id: leadId };
  if (opts.accountId) filter.accountId = opts.accountId;
  if (opts.mode === 'due') {
    filter.status = 'pending';
    filter.nextCallAt = { $ne: null, $lte: now };
  } else if (opts.mode === 'new') {
    filter.status = 'pending';
  } else {
    filter.status = { $ne: 'calling' };
  }

  // Retry and Call now are refused up front when the balance is empty, so the
  // lead keeps the result it already has instead of losing it to a call that
  // was never placed.
  if (opts.mode === 'manual') {
    const target = await Lead.findOne(filter).select('accountId').lean<{ accountId: string }>();
    if (target) {
      const credit = await canPlaceCall(target.accountId);
      if (!credit.ok && credit.balance <= 0) return { ok: false, code: 'no_credits', message: MESSAGES.no_credits };
    }
  }

  const before = await Lead.findOneAndUpdate(filter, { $set: { status: 'calling', calledAt: now, updatedAt: now } }, { new: false });
  if (!before) {
    const exists = await Lead.exists({ _id: leadId, ...(opts.accountId && { accountId: opts.accountId }) });
    const code = exists ? 'in_progress' : 'not_found';
    return { ok: false, code, message: MESSAGES[code] };
  }

  // Retry on a finished lead starts a new round. Call now on a waiting lead does not.
  const wasWaiting = before.status === 'pending' && !!before.nextCallAt;
  const newRound = opts.mode === 'manual' && !wasWaiting;
  await Lead.updateOne(
    { _id: leadId },
    newRound
      ? { $set: { nextCallAt: null, outcome: null, tries: 0 }, $unset: { callResults: 1 } }
      : { $set: { nextCallAt: null, outcome: null } }
  );

  const lead = await Lead.findById(leadId);
  if (!lead) return { ok: false, code: 'not_found', message: MESSAGES.not_found };

  const assistant = lead.assignedAssistantId ? await Assistant.findById(lead.assignedAssistantId) : null;
  const timezone = assistantTimezone(assistant);

  const fail = async (code: 'no_credits' | 'not_placed' | 'invalid_number', detail?: string): Promise<StartResult> => {
    await finish(lead, code);
    logger.warn('LEAD_CALL_NOT_PLACED', `Lead not called: ${code}`, {
      accountId: lead.accountId,
      leadId: lead._id.toString(),
      data: { code, mode: opts.mode, detail },
    });
    if (code === 'no_credits') await notifyCallsStopped({ lead, timezone });
    return { ok: false, code, message: MESSAGES[code] };
  };

  const credit = await canPlaceCall(lead.accountId);
  if (!credit.ok) return fail(credit.balance <= 0 ? 'no_credits' : 'not_placed', credit.reason);

  // Each lead is called with its own assistant. There is no general fallback:
  // a lead with no assistant would hear someone else's script.
  if (!assistant || !assistant.vapiAssistantId || assistant.accountId !== lead.accountId) {
    return fail('not_placed', 'The lead has no assistant');
  }

  const attempts = Math.max(1, opts.transientRetries ?? 1);
  let lastError = '';

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const call = await new TenantVapiService().initiateCall({
        accountId: lead.accountId,
        phoneNumber: lead.phoneNumber,
        assistantId: assistant.vapiAssistantId,
        ...(lead.phoneProviderId && { phoneProviderId: lead.phoneProviderId }),
        customer: { name: lead.name, ...(lead.email && { email: lead.email }) },
        variableValues: buildCallVariables(assistant, lead),
        metadata: {
          leadId: lead._id.toString(),
          accountId: lead.accountId,
          assistantId: assistant._id.toString(),
          source: lead.source || 'lead',
          try: (lead.tries || 0) + 1,
        },
      });

      await Lead.updateOne(
        { _id: lead._id },
        {
          $set: { vapiCallId: call.id, calledAt: new Date(), updatedAt: new Date() },
          $inc: { tries: 1 },
          $push: { attempts: { vapiCallId: call.id, startedAt: new Date() } },
        }
      );
      await Assistant.updateOne({ _id: assistant._id }, { $set: { lastUsed: new Date() } });

      logger.info('LEAD_CALL_STARTED', 'Call to lead started', {
        accountId: lead.accountId,
        leadId: lead._id.toString(),
        vapiCallId: call.id,
        data: { mode: opts.mode, try: (lead.tries || 0) + 1 },
      });
      return { ok: true, callId: call.id };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      // The balance can empty between the check above and the call.
      if (lastError.startsWith('No credits left')) return fail('no_credits', lastError);
      if (looksLikeBadNumber(lastError)) return fail('invalid_number', lastError);
      if (attempt < attempts) await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
  }

  logger.error('LEAD_CALL_ERROR', 'Could not start the call', {
    accountId: lead.accountId,
    leadId: lead._id.toString(),
    data: { mode: opts.mode, error: lastError },
  });
  return fail('not_placed', lastError);
}

/**
 * A lead has just arrived. Calls it now, or, when the assistant holds leads
 * outside its calling hours and it is outside them, leaves it waiting.
 */
export async function callOrHold(
  lead: any,
  assistant: any,
  opts: { transientRetries?: number } = {}
): Promise<StartResult | { ok: true; held: true; callAt: Date }> {
  const rules = callingRulesOf(assistant);
  if (rules.holdOutsideHours) {
    const now = new Date();
    const callAt = nextCallingTime(now, rules, assistantTimezone(assistant));
    if (callAt.getTime() > now.getTime()) {
      await Lead.updateOne({ _id: lead._id }, { $set: { status: 'pending', nextCallAt: callAt, updatedAt: now } });
      logger.info('LEAD_HELD', 'Lead held until calling hours open', {
        accountId: lead.accountId,
        leadId: lead._id.toString(),
        data: { callAt: callAt.toISOString() },
      });
      await noteWaiting();
      return { ok: true, held: true, callAt };
    }
  }
  return startLeadCall(lead._id.toString(), { mode: 'new', transientRetries: opts.transientRetries });
}

/** Leaves a lead for the wake-up to call: at once, or when calling hours open if the assistant holds leads. */
export async function queueLead(lead: any, assistant: any): Promise<{ ok: true; held: true; callAt: Date }> {
  const rules = callingRulesOf(assistant);
  const now = new Date();
  const callAt = rules.holdOutsideHours ? nextCallingTime(now, rules, assistantTimezone(assistant)) : now;
  await Lead.updateOne({ _id: lead._id }, { $set: { status: 'pending', nextCallAt: callAt, updatedAt: now } });
  return { ok: true, held: true, callAt };
}

/** The client stopped a waiting lead. Returns false when it was not waiting. */
export async function stopLeadCalls(leadId: string, accountId: string): Promise<boolean> {
  await connectToDatabase();
  const result = await Lead.updateOne(
    { _id: leadId, accountId, status: 'pending', nextCallAt: { $ne: null } },
    { $set: { status: 'failed', outcome: 'stopped', nextCallAt: null, updatedAt: new Date() } }
  );
  return result.modifiedCount === 1;
}

/* ------------------------------ when a call ends ------------------------------ */

/**
 * Whether this call is one of the lead's recorded tries. Leads created before
 * tries were recorded, and the assistant's own test calls, are not; for those
 * the caller keeps its earlier behaviour.
 */
export function isTrackedCall(lead: any, callId: string): boolean {
  return (lead?.attempts || []).some((a: any) => a.vapiCallId === callId);
}

/**
 * Records how a call ended and decides what happens to the lead: done, or
 * another try later. Safe to call twice for the same call: only the first
 * closes the attempt, and only the first can schedule a try or send an email.
 */
export async function recordCallEnded(input: { leadId: string; callId: string; endedReason?: string | null }): Promise<void> {
  await connectToDatabase();
  const result = attemptResult(input.endedReason);
  const now = new Date();

  const closed = await Lead.updateOne(
    { _id: input.leadId, attempts: { $elemMatch: { vapiCallId: input.callId, endedAt: null } } },
    { $set: { 'attempts.$.endedAt': now, 'attempts.$.result': result, 'attempts.$.endReason': input.endedReason || null } }
  );
  if (closed.modifiedCount !== 1) return;

  const lead = await Lead.findById(input.leadId);
  if (!lead) return;

  // A report for an earlier try that arrives late must not disturb the lead.
  if (lead.vapiCallId !== input.callId) return;
  if (lead.outcome === 'stopped') return;

  if (result === 'answered') {
    await Lead.updateOne({ _id: lead._id, vapiCallId: input.callId }, { $set: { status: 'completed', outcome: null, nextCallAt: null } });
    return;
  }

  const assistant = lead.assignedAssistantId ? await Assistant.findById(lead.assignedAssistantId) : null;
  const rules = callingRulesOf(assistant);
  const timezone = assistantTimezone(assistant);
  const tries = Math.max(1, Number(lead.tries) || 1);

  if (result === 'not_connected') {
    await Lead.updateOne({ _id: lead._id, vapiCallId: input.callId }, { $set: { status: 'failed', outcome: 'not_placed', nextCallAt: null } });
    return;
  }

  const booked = await Appointment.exists({ leadId: lead._id.toString(), status: 'booked' });

  if (RINGS_OUT.includes(result) && rules.retry && tries < rules.maxCalls && !booked) {
    const delays = retryDelaysSeconds();
    const wait = delays[Math.min(tries - 1, delays.length - 1)] * 1000;
    // A later try never lands outside the calling hours, whether or not holding is on.
    const nextCallAt = nextCallingTime(new Date(now.getTime() + wait), rules, timezone);
    await Lead.updateOne(
      { _id: lead._id, vapiCallId: input.callId },
      { $set: { status: 'pending', outcome: null, nextCallAt } }
    );
    logger.info('LEAD_RETRY_SCHEDULED', 'Next try scheduled', {
      accountId: lead.accountId,
      leadId: lead._id.toString(),
      vapiCallId: input.callId,
      data: { try: tries, of: rules.maxCalls, nextCallAt: nextCallAt.toISOString(), result },
    });
    await noteWaiting();
    return;
  }

  await Lead.updateOne({ _id: lead._id, vapiCallId: input.callId }, { $set: { status: 'failed', outcome: 'no_answer', nextCallAt: null } });

  // Only form leads: an uploaded list can ring out hundreds of times.
  if (lead.source === 'form' && !booked) {
    await notifyUnreached({ lead: { ...lead.toObject(), attempts: roundAttempts(lead) }, timezone });
  }
}

/* -------------------------------- the wake-up -------------------------------- */

const DUE_BATCH = 10;
const STUCK_BATCH = 10;
/** A call still unreported after this long is looked up. Longer than any call lasts. */
const STUCK_AFTER_MS = 20 * 60 * 1000;
/** After this long with nothing to find, the lead is closed. */
const GIVE_UP_AFTER_MS = 55 * 60 * 1000;

/** Calls every lead whose time has come. Each is claimed atomically, so overlapping runs cannot double-call. */
export async function runDueCalls(): Promise<{ due: number; started: number }> {
  await connectToDatabase();
  const due = await Lead.find({ status: 'pending', nextCallAt: { $ne: null, $lte: new Date() } })
    .sort({ nextCallAt: 1 })
    .limit(DUE_BATCH)
    .select('_id')
    .lean();

  let started = 0;
  for (const row of due) {
    const result = await startLeadCall(String(row._id), { mode: 'due' });
    if (result.ok) started++;
  }
  return { due: due.length, started };
}

/**
 * Finds leads whose call never reported back, asks the phone system what
 * happened, and gives each its real result, charging the call if it was not
 * charged. The charge is keyed on the call id, so a report that turns up
 * afterwards cannot charge it again.
 */
export async function reconcileStuckCalls(): Promise<{ checked: number; resolved: number }> {
  await connectToDatabase();
  const now = Date.now();
  const stuck = await Lead.find({ status: 'calling', calledAt: { $lte: new Date(now - STUCK_AFTER_MS) } })
    .sort({ calledAt: 1 })
    .limit(STUCK_BATCH);

  let resolved = 0;
  const vapi = new TenantVapiService();

  for (const lead of stuck) {
    const leadId = lead._id.toString();
    const tooOld = now - new Date(lead.calledAt || lead.updatedAt).getTime() > GIVE_UP_AFTER_MS;

    try {
      let call: any = null;
      if (lead.vapiCallId) {
        try {
          call = await vapi.getCallStatus(lead.vapiCallId);
        } catch (error) {
          logger.warn('RECONCILE_LOOKUP_FAILED', 'Could not look the call up', {
            accountId: lead.accountId,
            leadId,
            vapiCallId: lead.vapiCallId,
            data: { error: error instanceof Error ? error.message : String(error) },
          });
        }
      }

      if (call?.status === 'ended') {
        const seconds =
          call.startedAt && call.endedAt ? Math.max(0, Math.round((Date.parse(call.endedAt) - Date.parse(call.startedAt)) / 1000)) : 0;
        const assistant = lead.assignedAssistantId ? await Assistant.findById(lead.assignedAssistantId).select('name').lean<any>() : null;

        await chargeCall({
          accountId: lead.accountId,
          vapiCallId: lead.vapiCallId,
          seconds,
          assistantName: assistant?.name,
          assistantId: lead.assignedAssistantId?.toString(),
        });

        const answered = !NOT_ANSWERED_REASONS.includes(call.endedReason);
        await Lead.updateOne(
          { _id: lead._id, vapiCallId: lead.vapiCallId },
          {
            $set: {
              'callResults.answered': answered,
              'callResults.duration': seconds,
              'callResults.endReason': call.endedReason || null,
              ...(call.analysis?.summary && { 'callResults.summary': call.analysis.summary }),
              updatedAt: new Date(),
            },
          }
        );

        if (isTrackedCall(lead, lead.vapiCallId)) {
          await recordCallEnded({ leadId, callId: lead.vapiCallId, endedReason: call.endedReason });
        } else {
          await Lead.updateOne(
            { _id: lead._id, status: 'calling' },
            { $set: { status: answered ? 'completed' : 'failed', outcome: answered ? null : 'no_answer' } }
          );
        }
        resolved++;
        logger.info('RECONCILE_RESOLVED', 'Gave a stuck lead its real result', {
          accountId: lead.accountId,
          leadId,
          vapiCallId: lead.vapiCallId,
          data: { endedReason: call.endedReason, seconds },
        });
        continue;
      }

      // Still in progress according to the phone system, or nothing known yet: wait, up to the limit.
      if (!tooOld && lead.vapiCallId) continue;

      await Lead.updateOne({ _id: lead._id, status: 'calling' }, { $set: { status: 'failed', outcome: 'not_placed', nextCallAt: null, updatedAt: new Date() } });
      if (lead.vapiCallId) {
        // Close the open try, so the lead's page does not show it as in progress for ever.
        await Lead.updateOne(
          { _id: lead._id, attempts: { $elemMatch: { vapiCallId: lead.vapiCallId, endedAt: null } } },
          { $set: { 'attempts.$.endedAt': new Date(), 'attempts.$.result': 'not_connected' } }
        );
      }
      resolved++;
      logger.warn('RECONCILE_GAVE_UP', 'Nothing could be found out about the call', {
        accountId: lead.accountId,
        leadId,
        vapiCallId: lead.vapiCallId || undefined,
      });
    } catch (error) {
      logger.error('RECONCILE_ERROR', 'Failed to reconcile a stuck lead', { accountId: lead.accountId, leadId, error });
    }
  }

  return { checked: stuck.length, resolved };
}
