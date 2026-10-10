import { NextRequest, NextResponse } from 'next/server';
import { getAccountAuth } from '@/lib/account';
import { auth } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Lead from '@/models/Lead';
import Assistant from '@/models/Assistant';
import Appointment from '@/models/Appointment';
import { logger } from '@/lib/logger';

/**
 * Everything the dashboard draws, in one round trip.
 *
 * The dashboard used to be static tiles plus an onboarding block, so there was
 * never a stats endpoint. Charts need a dense daily series with no gaps — a
 * missing day has to read as zero, not as a break in the line — so buckets are
 * pre-filled here rather than reconstructed in the browser.
 *
 * Days are bucketed in the caller's timezone. Bucketing in UTC puts an evening
 * call in the wrong column for anyone west of Greenwich, which is most of the
 * customer base.
 */

const MAX_DAYS = 90;

interface Bucket {
  date: string;
  leads: number;
  calls: number;
  answered: number;
  booked: number;
}

/** YYYY-MM-DD in the given IANA zone. */
function dayKey(d: Date, timeZone: string): string {
  // en-CA gives ISO-shaped output, which sorts lexically.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** Ordered, gap-free day keys ending today. */
function dayRange(days: number, timeZone: string): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = days - 1; i >= 0; i--) {
    out.push(dayKey(new Date(now - i * 86_400_000), timeZone));
  }
  return out;
}

function pct(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

/** Percentage change, or null when there is no prior figure to compare against. */
function delta(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export async function GET(request: NextRequest) {
  try {
    const { accountId } = await getAccountAuth();
    if (!accountId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const days = Math.min(Math.max(parseInt(params.get('days') || '30', 10) || 30, 7), MAX_DAYS);

    let timeZone = params.get('tz') || 'UTC';
    try {
      new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
    } catch {
      timeZone = 'UTC';
    }

    await connectToDatabase();

    const windowMs = days * 86_400_000;
    // Start from the beginning of the earliest day in the range, not from
    // "now minus N days", so the first column isn't a partial day.
    const keys = dayRange(days, timeZone);
    const from = new Date(Date.now() - windowMs);
    const prevFrom = new Date(from.getTime() - windowMs);

    const [current, previous, assistantRows, bookingDocs, upcomingDocs, recentDocs] =
      await Promise.all([
        Lead.find({ accountId, createdAt: { $gte: from } })
          .select('status createdAt calledAt callResults assignedAssistantId')
          .lean(),
        Lead.find({ accountId, createdAt: { $gte: prevFrom, $lt: from } })
          .select('status callResults')
          .lean(),
        Assistant.find({ accountId }).select('name serviceConfig isActive').lean(),
        // Bookings come from here, not from Lead.callResults — the appointment
        // is the ledger and the lead flag is a denormalized copy that drifts.
        // Both windows in one pass so the delta has something to compare to.
        Appointment.find({ accountId, status: 'booked', createdAt: { $gte: prevFrom } })
          .select('createdAt assistantId leadId')
          .lean(),
        // Upcoming is not window-bound: a visit booked last month can still be
        // in the future, so this is a separate, recency-capped read.
        Appointment.find({ accountId, status: 'booked' })
          .select('appointmentData createdAt timezone')
          .sort({ createdAt: -1 })
          .limit(300)
          .lean(),
        Lead.find({ accountId, calledAt: { $ne: null } })
          .select('name status calledAt callResults assignedAssistantId')
          .sort({ calledAt: -1 })
          .limit(8)
          .lean(),
      ]);

    // Bookings split by window, keyed for per-assistant and per-lead lookup.
    const bookingsInWindow: any[] = [];
    const bookingsPrior: any[] = [];
    const bookedLeadIds = new Set<string>();
    for (const b of bookingDocs as any[]) {
      const at = new Date(b.createdAt).getTime();
      if (at >= from.getTime()) {
        bookingsInWindow.push(b);
        if (b.leadId) bookedLeadIds.add(String(b.leadId));
      } else {
        bookingsPrior.push(b);
      }
    }

    // --- daily series -------------------------------------------------------
    const buckets = new Map<string, Bucket>(
      keys.map((date) => [date, { date, leads: 0, calls: 0, answered: 0, booked: 0 }])
    );

    for (const lead of current as any[]) {
      const created = buckets.get(dayKey(new Date(lead.createdAt), timeZone));
      if (created) created.leads++;

      if (lead.calledAt) {
        const called = buckets.get(dayKey(new Date(lead.calledAt), timeZone));
        if (called) {
          called.calls++;
          if (lead.callResults?.answered) called.answered++;
        }
      }
    }

    for (const b of bookingsInWindow) {
      const day = buckets.get(dayKey(new Date(b.createdAt), timeZone));
      if (day) day.booked++;
    }

    // --- totals -------------------------------------------------------------
    const tally = (rows: any[], bookings: number) =>
      rows.reduce(
        (acc, lead) => {
          acc.leads++;
          if (lead.calledAt || lead.status === 'completed' || lead.status === 'failed') acc.calls++;
          if (lead.callResults?.answered) acc.answered++;
          acc.talkSeconds += lead.callResults?.duration || 0;
          acc.spend += lead.callResults?.cost || 0;
          return acc;
        },
        { leads: 0, calls: 0, answered: 0, booked: bookings, talkSeconds: 0, spend: 0 }
      );

    const totals = tally(current as any[], bookingsInWindow.length);
    const prior = tally(previous as any[], bookingsPrior.length);

    // --- status mix ---------------------------------------------------------
    const outcomes = { completed: 0, failed: 0, pending: 0, calling: 0 };
    for (const lead of current as any[]) {
      if (lead.status in outcomes) outcomes[lead.status as keyof typeof outcomes]++;
    }

    // --- per-assistant ------------------------------------------------------
    const byAssistant = new Map<string, { calls: number; booked: number }>();
    for (const lead of current as any[]) {
      if (!lead.assignedAssistantId) continue;
      const id = String(lead.assignedAssistantId);
      const row = byAssistant.get(id) || { calls: 0, booked: 0 };
      if (lead.calledAt) row.calls++;
      byAssistant.set(id, row);
    }
    for (const b of bookingsInWindow) {
      if (!b.assistantId) continue;
      const id = String(b.assistantId);
      const row = byAssistant.get(id) || { calls: 0, booked: 0 };
      row.booked++;
      byAssistant.set(id, row);
    }

    const assistants = (assistantRows as any[])
      .map((a) => {
        const row = byAssistant.get(String(a._id)) || { calls: 0, booked: 0 };
        return {
          id: String(a._id),
          name: a.name as string,
          vertical: a.serviceConfig?.vertical || null,
          isActive: a.isActive !== false,
          calls: row.calls,
          booked: row.booked,
          bookRate: pct(row.booked, row.calls),
        };
      })
      .sort((a, b) => b.booked - a.booked || b.calls - a.calls)
      .slice(0, 5);

    // --- appointments -------------------------------------------------------
    // startTime is stored as an ISO string, so sorting has to happen after
    // parsing — a lexical sort breaks across differing offsets.
    const now = Date.now();
    const upcoming = (upcomingDocs as any[])
      .map((a) => ({
        id: String(a._id),
        title: a.appointmentData?.title || 'Service visit',
        startTime: a.appointmentData?.startTime,
        timezone: a.timezone || null,
        customer: a.appointmentData?.customer?.name || 'Customer',
        at: new Date(a.appointmentData?.startTime || 0).getTime(),
      }))
      .filter((a) => a.at >= now)
      .sort((a, b) => a.at - b.at)
      .slice(0, 5)
      .map(({ at, ...rest }) => rest);

    const assistantNames = new Map(
      (assistantRows as any[]).map((a) => [String(a._id), a.name as string])
    );

    const recent = (recentDocs as any[]).map((lead) => ({
      id: String(lead._id),
      name: lead.name,
      status: lead.status,
      calledAt: lead.calledAt,
      duration: lead.callResults?.duration || 0,
      booked: bookedLeadIds.has(String(lead._id)) || !!lead.callResults?.appointmentCreated,
      answered: !!lead.callResults?.answered,
      assistant: lead.assignedAssistantId
        ? assistantNames.get(String(lead.assignedAssistantId)) || null
        : null,
    }));

    return NextResponse.json({
      range: { days, timeZone, from: from.toISOString() },
      series: keys.map((k) => buckets.get(k)!),
      totals: {
        ...totals,
        talkMinutes: Math.round(totals.talkSeconds / 60),
        spend: Math.round(totals.spend * 100) / 100,
        answerRate: pct(totals.answered, totals.calls),
        bookRate: pct(totals.booked, totals.calls),
      },
      deltas: {
        leads: delta(totals.leads, prior.leads),
        calls: delta(totals.calls, prior.calls),
        booked: delta(totals.booked, prior.booked),
        answerRate: delta(pct(totals.answered, totals.calls), pct(prior.answered, prior.calls)),
      },
      outcomes,
      assistants,
      upcoming,
      recent,
      // Lets the client tell "nothing happened in this window" apart from
      // "this account has never done anything", which read the same otherwise.
      hasAnyData: totals.leads > 0 || prior.leads > 0 || assistantRows.length > 0,
    });
  } catch (error) {
    logger.error('DASHBOARD_STATS_ERROR', 'Failed to build dashboard stats', {
      data: { error: error instanceof Error ? error.message : String(error) },
    });
    return NextResponse.json({ error: 'Failed to load dashboard stats' }, { status: 500 });
  }
}
