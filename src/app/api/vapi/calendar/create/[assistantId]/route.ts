import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Assistant from '@/models/Assistant';
import Appointment from '@/models/Appointment';
import Lead from '@/models/Lead';
import { calendarManager } from '@/lib/calendar/manager';
import { logger } from '@/lib/logger';
import { parseToolCall, toolResult, rateLimit } from '@/lib/speedToLead/vapiToolBridge';
import { DEFAULT_BUSINESS_HOURS } from '@/lib/speedToLead/verticals';

/**
 * bookAppointment — writes the technician visit to the calendar mid-call.
 *
 * Unauthenticated by product decision, so every write is defended by shape:
 * the slot must be in the future, inside the booking horizon, inside business
 * hours, and still free at the moment of writing. An Appointment row is always
 * recorded for audit, whether or not the calendar write succeeds.
 */

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const DAILY_BOOKING_CAP = 50;

async function handle(req: NextRequest, assistantId: string) {
  const { toolCallId, args, callId, phoneNumberId, customerNumber, leadId } = await parseToolCall(req);

  if (!rateLimit(`book:${assistantId}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    logger.warn('VAPI_BOOK_RATE_LIMITED', 'Booking rate limit hit', { data: { assistantId } });
    return toolResult(toolCallId, { ok: false, message: 'Too many booking attempts. Try again shortly.' });
  }

  if (!mongoose.Types.ObjectId.isValid(assistantId)) {
    return toolResult(toolCallId, { ok: false, message: 'Unknown assistant.' });
  }

  await connectToDatabase();
  const assistant = await Assistant.findOne({ _id: assistantId, isActive: true });
  if (!assistant) {
    return toolResult(toolCallId, { ok: false, message: 'Unknown assistant.' });
  }

  const startTime = String(args.startTime || args.start || '').trim();
  const customerName = String(args.customerName || args.name || '').trim();
  const address = String(args.address || '').trim();
  const problemSummary = String(args.problemSummary || args.summary || '').trim();

  // Resolve the lead early — it is the most reliable source of the phone number
  // for an outbound call, and we need it to write the booking back onto the lead.
  //
  // `metadata.leadId` is set when we place the call over the REST API, but it
  // does not survive a browser test call: the web SDK takes metadata inside
  // `assistantOverrides`, which has no such field, and drops it silently. So
  // fall back to the call id, which every path records on the lead.
  const lead =
    (leadId && mongoose.Types.ObjectId.isValid(leadId) ? await Lead.findById(leadId) : null) ||
    (callId ? await Lead.findOne({ vapiCallId: callId }) : null);

  // Trust the call payload and the lead over anything the model said. A model
  // asked for a phone number will happily answer "the number you are calling on".
  const looksLikePhone = (v: string) => /^\+?[\d\s().-]{7,}$/.test(v);
  const modelPhone = String(args.phoneNumber || args.phone || '').trim();
  const phoneNumber =
    customerNumber ||
    lead?.phoneNumber ||
    (looksLikePhone(modelPhone) ? modelPhone : '') ||
    '';

  if (!startTime || !customerName || !address) {
    return toolResult(toolCallId, {
      ok: false,
      message: 'startTime, customerName and address are all required to book.',
    });
  }

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) {
    return toolResult(toolCallId, { ok: false, message: 'That date could not be understood.' });
  }

  const cfg = assistant.serviceConfig;
  const durationMins = cfg?.appointmentDurationMins ?? 90;
  const timezone = cfg?.timezone || 'America/New_York';
  const horizonDays = cfg?.bookingHorizonDays ?? 14;
  const end = new Date(start.getTime() + durationMins * 60_000);

  const now = Date.now();
  if (start.getTime() < now) {
    return toolResult(toolCallId, { ok: false, message: 'That time has already passed. Offer a future slot.' });
  }
  if (start.getTime() > now + horizonDays * 86_400_000) {
    return toolResult(toolCallId, {
      ok: false,
      message: `We only book ${horizonDays} days ahead. Offer something sooner.`,
    });
  }

  // Cheap ceiling on a leaked assistant id being used to spam a real calendar.
  const since = new Date(now - 86_400_000);
  const todaysBookings = await Appointment.countDocuments({
    userId: assistant.userId,
    createdAt: { $gte: since },
  });
  if (todaysBookings >= DAILY_BOOKING_CAP) {
    logger.warn('VAPI_BOOK_DAILY_CAP', 'Daily booking cap reached', {
      userId: assistant.userId,
      data: { assistantId, todaysBookings },
    });
    return toolResult(toolCallId, {
      ok: false,
      message: 'The schedule is full for now. Offer a callback instead.',
    });
  }

  const businessHours = Object.fromEntries(
    Object.entries(
      (cfg?.businessHours instanceof Map
        ? Object.fromEntries(cfg.businessHours)
        : cfg?.businessHours) || DEFAULT_BUSINESS_HOURS
    ).map(([k, v]) => [Number(k), v as { open: string; close: string }])
  );

  // Re-check immediately before writing: the agent may have talked for a while
  // since checkAvailability, and something else could have taken the slot.
  const availability = await calendarManager.findAvailability(assistant.userId, {
    start: start.toISOString(),
    end: end.toISOString(),
    durationMins,
    timezone,
    businessHours,
    maxAlternatives: 3,
  });

  if (!availability.error && !availability.free) {
    return toolResult(toolCallId, {
      ok: false,
      free: false,
      alternatives: availability.alternatives,
      message: 'That slot was taken while you were talking. Offer one of the alternatives.',
    });
  }

  const title = `${cfg?.vertical ? `${cfg.vertical.toUpperCase()} ` : ''}Service — ${customerName}`;
  const description = [
    `Customer: ${customerName}`,
    phoneNumber ? `Phone: ${phoneNumber}` : null,
    `Address: ${address}`,
    problemSummary ? `Problem: ${problemSummary}` : null,
    '',
    'Booked automatically by Laycal during the intake call.',
  ]
    .filter(Boolean)
    .join('\n');

  const attendees = lead?.email ? [lead.email] : undefined;

  // A homeowner changing their mind mid-call is normal, and the agent handles
  // it by simply calling bookAppointment again. Without this lookup that
  // produced a second calendar event and a second appointment row, leaving the
  // dispatcher with two visits and no idea which one is real. One booking per
  // call: the second call moves the first.
  const existing = callId
    ? await Appointment.findOne({ vapiCallId: callId, status: 'booked' })
    : null;

  const eventPayload = {
    title,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    description,
    location: address,
    attendees,
  };

  let result: { success: boolean; eventId?: string; error?: string };

  if (existing?.calendarEventId) {
    const providers = await calendarManager.getUserActiveProviders(assistant.userId);
    const provider = providers[0] ? calendarManager.getProvider(providers[0]) : undefined;

    result = provider
      ? await provider.updateEvent(assistant.userId, existing.calendarEventId, eventPayload)
      : { success: false, error: 'No active calendar provider' };

    if (result.success) result.eventId = existing.calendarEventId;
  } else {
    result = await calendarManager.createEventOn(assistant.userId, eventPayload);
  }

  if (result.success) {
    // Record it on the appointment list and on the lead itself. Without this the
    // booking only exists in Google Calendar and the dashboard shows nothing.
    try {
      const appointmentData = {
        title,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        customer: {
          name: customerName,
          phone: phoneNumber || 'unknown',
          ...(lead?.email && { email: lead.email }),
        },
        notes: description,
      };

      if (existing) {
        existing.appointmentData = appointmentData as any;
        existing.callData = { ...(existing.callData || {}), summary: problemSummary || undefined };
        if (result.eventId) existing.calendarEventId = result.eventId;
        if (!existing.leadId && lead?._id) existing.leadId = lead._id;
        await existing.save();
      } else {
        await Appointment.create({
          vapiCallId: callId || `direct-${assistantId}-${start.getTime()}`,
          phoneNumberId: phoneNumberId || 'speed-to-lead',
          userId: assistant.userId,
          assistantId: assistant._id,
          leadId: lead?._id ?? null,
          source: 'speed_to_lead_in_call',
          timezone,
          // Booked live during the call — there is nothing left to approve.
          status: 'booked',
          appointmentData,
          callData: { summary: problemSummary || undefined },
          calendarEventId: result.eventId,
        });
      }
    } catch (auditError) {
      logger.error('VAPI_BOOK_AUDIT_FAILED', 'Could not write appointment record', {
        userId: assistant.userId,
        error: auditError,
        data: { assistantId },
      });
    }

    if (lead) {
      try {
        lead.callResults = {
          ...(lead.callResults || { answered: true }),
          answered: true,
          appointmentCreated: true,
          appointmentTitle: title,
          appointmentTime: start.toISOString(),
        };
        if (address && !lead.address) lead.address = address;
        await lead.save();
      } catch (leadError) {
        logger.error('VAPI_BOOK_LEAD_UPDATE_FAILED', 'Could not write booking back to lead', {
          userId: assistant.userId,
          leadId: String(lead._id),
          error: leadError,
        });
      }
    }
  }

  if (!result.success) {
    logger.error('VAPI_BOOK_FAILED', 'Calendar write failed during call', {
      userId: assistant.userId,
      data: { assistantId, error: result.error },
    });
    return toolResult(toolCallId, {
      ok: false,
      message:
        'The booking did not go through. Tell the homeowner someone will call right back to lock in the time.',
    });
  }

  logger.info('VAPI_BOOK_SUCCESS', 'Appointment booked during call', {
    userId: assistant.userId,
    data: {
      assistantId,
      startTime: start.toISOString(),
      eventId: result.eventId,
      moved: !!existing,
    },
  });

  const resolved = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(start);

  return toolResult(toolCallId, {
    ok: true,
    booked: true,
    moved: !!existing,
    startTime: start.toISOString(),
    resolved,
    durationMins,
    timezone,
    message: existing
      ? `Moved. The visit is now ${resolved}. Say that back to the homeowner along with the address, then close warmly.`
      : `Booked for ${resolved}. Recap that day, date, time and address out loud, then close warmly.`,
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ assistantId: string }> }) {
  const { assistantId } = await ctx.params;
  try {
    return await handle(req, assistantId);
  } catch (error) {
    logger.error('VAPI_BOOK_ERROR', 'Booking failed', { error, data: { assistantId } });
    return toolResult(null, { ok: false, message: 'Booking failed.' });
  }
}
