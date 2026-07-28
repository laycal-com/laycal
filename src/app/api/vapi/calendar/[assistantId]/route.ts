import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/mongodb';
import Assistant from '@/models/Assistant';
import { calendarManager } from '@/lib/calendar/manager';
import { logger } from '@/lib/logger';
import { parseToolCall, toolResult, rateLimit } from '@/lib/speedToLead/vapiToolBridge';
import { DEFAULT_BUSINESS_HOURS } from '@/lib/speedToLead/verticals';

/**
 * checkAvailability — called by the agent mid-conversation.
 *
 * Unauthenticated by product decision: Vapi cannot present a Clerk session. The
 * assistant id is the only credential, so this route is read-only, rate limited,
 * and never echoes calendar contents — only free/busy windows.
 *
 * Vapi issues POST for tool calls; GET exists so the endpoint can be checked by
 * hand with ?startTime=...
 */

const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

async function handle(req: NextRequest, assistantId: string) {
  const { toolCallId, args } = await parseToolCall(req);

  if (!rateLimit(`avail:${assistantId}`, RATE_LIMIT, RATE_WINDOW_MS)) {
    logger.warn('VAPI_CALENDAR_RATE_LIMITED', 'Availability rate limit hit', {
      data: { assistantId },
    });
    return toolResult(toolCallId, {
      ok: false,
      message: 'Too many availability checks right now. Try again in a moment.',
    });
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
  if (!startTime) {
    return toolResult(toolCallId, { ok: false, message: 'A startTime is required.' });
  }

  const start = new Date(startTime);
  if (Number.isNaN(start.getTime())) {
    return toolResult(toolCallId, {
      ok: false,
      message: 'That date could not be understood. Use a full ISO 8601 datetime with offset.',
    });
  }

  const cfg = assistant.serviceConfig;
  const durationMins = cfg?.appointmentDurationMins ?? 90;
  const timezone = cfg?.timezone || 'America/New_York';
  const horizonDays = cfg?.bookingHorizonDays ?? 14;

  // Never quote a slot in the past or beyond the booking horizon.
  const now = Date.now();
  if (start.getTime() < now - 60_000) {
    return toolResult(toolCallId, {
      ok: true,
      free: false,
      message: 'That time is in the past. Offer the earliest upcoming slot instead.',
      alternatives: [],
    });
  }
  if (start.getTime() > now + horizonDays * 86_400_000) {
    return toolResult(toolCallId, {
      ok: true,
      free: false,
      message: `That is further out than we book (${horizonDays} days). Offer something sooner.`,
      alternatives: [],
    });
  }

  const end = new Date(start.getTime() + durationMins * 60_000);

  const businessHours = Object.fromEntries(
    Object.entries(
      (cfg?.businessHours instanceof Map
        ? Object.fromEntries(cfg.businessHours)
        : cfg?.businessHours) || DEFAULT_BUSINESS_HOURS
    ).map(([k, v]) => [Number(k), v as { open: string; close: string }])
  );

  const availability = await calendarManager.findAvailability(assistant.userId, {
    start: start.toISOString(),
    end: end.toISOString(),
    durationMins,
    timezone,
    businessHours,
    maxAlternatives: 3,
  });

  if (availability.needsReconnect) {
    logger.error('VAPI_CALENDAR_SCOPE', 'Calendar grant is missing the freebusy scope', {
      userId: assistant.userId,
      data: { assistantId },
    });
  }

  if (availability.error) {
    return toolResult(toolCallId, {
      ok: false,
      message:
        'The schedule is unavailable right now. Tell the homeowner someone will call straight back to confirm a time.',
    });
  }

  logger.info('VAPI_CALENDAR_CHECK', 'Availability checked for assistant', {
    userId: assistant.userId,
    data: { assistantId, startTime: start.toISOString(), free: availability.free },
  });

  // Echo back the weekday and date the server actually resolved. The model is
  // the thing most likely to have got this wrong ("Thursday" booked as a
  // Tuesday), and hearing its own input read back in words is the cheapest
  // place to catch it — before anything is written to a calendar.
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
    free: availability.free,
    requested: availability.requested,
    resolved,
    alternatives: availability.alternatives,
    timezone,
    message: availability.free
      ? `That slot is open. It is ${resolved}. Say that day and date back to the homeowner and wait for them to agree, then call bookAppointment. If ${resolved} is not the day they asked for, you resolved the date wrong — check again with the correct date.`
      : availability.alternatives.length
        ? `${resolved} is taken. Offer the alternatives in plain language.`
        : `${resolved} is taken and nothing else is open nearby. Offer a callback.`,
  });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ assistantId: string }> }) {
  const { assistantId } = await ctx.params;
  try {
    return await handle(req, assistantId);
  } catch (error) {
    logger.error('VAPI_CALENDAR_ERROR', 'Availability check failed', { error, data: { assistantId } });
    return toolResult(null, { ok: false, message: 'Schedule lookup failed.' });
  }
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ assistantId: string }> }) {
  const { assistantId } = await ctx.params;
  try {
    return await handle(req, assistantId);
  } catch (error) {
    logger.error('VAPI_CALENDAR_ERROR', 'Availability check failed', { error, data: { assistantId } });
    return toolResult(null, { ok: false, message: 'Schedule lookup failed.' });
  }
}
