import { NextRequest } from 'next/server';
import crypto from 'crypto';
import * as Sentry from '@sentry/nextjs';
import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { sendMail } from '@/lib/mail';
import Heartbeat from '@/models/Heartbeat';
import Lead from '@/models/Lead';

/**
 * The wake-up.
 *
 * Calling later (a next try, a held night-time lead, a queued list) needs
 * something to run regularly. Vercel's free plan only schedules once a day, so
 * an outside scheduler (cron-job.org) calls /api/cron/tick every minute with
 * the secret below. If it ever stops, waiting leads would silently never be
 * called, so every tick records a heartbeat and `checkHeartbeat` raises an
 * error when it goes stale.
 */

const TICK = 'tick';
/** The scheduler runs every minute; this long without a tick means it has stopped. */
const STALE_AFTER_MS = 10 * 60 * 1000;
/** How often the owner is told while it stays stopped. */
const REALERT_AFTER_MS = 6 * 60 * 60 * 1000;

/** True when the request carries the cron secret. Without a secret configured, nothing is allowed. */
export function isCronRequest(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = req.headers.get('authorization') || '';
  const given = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function recordHeartbeat(): Promise<void> {
  await connectToDatabase();
  await Heartbeat.updateOne({ _id: TICK }, { $set: { at: new Date(), alertedAt: null } }, { upsert: true });
}

/**
 * Raises an error (log, Sentry, an email to the owner) when the wake-up has
 * stopped. Called by the daily watchdog and whenever a lead is left waiting,
 * so it is noticed the moment it matters rather than a day later.
 */
export async function checkHeartbeat(): Promise<{ ok: boolean; lastTick: Date | null; waiting: number }> {
  await connectToDatabase();
  const beat = await Heartbeat.findById(TICK).lean<{ at: Date; alertedAt?: Date | null }>();
  const lastTick = beat?.at ?? null;
  const stale = !lastTick || Date.now() - new Date(lastTick).getTime() > STALE_AFTER_MS;
  if (!stale) return { ok: true, lastTick, waiting: 0 };

  const waiting = await Lead.countDocuments({ status: 'pending', nextCallAt: { $ne: null } });
  const alertedRecently = beat?.alertedAt && Date.now() - new Date(beat.alertedAt).getTime() < REALERT_AFTER_MS;
  if (alertedRecently) return { ok: false, lastTick, waiting };

  await Heartbeat.updateOne({ _id: TICK }, { $set: { alertedAt: new Date() }, $setOnInsert: { at: new Date(0) } }, { upsert: true });

  const since = lastTick ? new Date(lastTick).toISOString() : 'never';
  const message = `The Laycal wake-up has stopped. Last run: ${since}. Leads waiting for a call: ${waiting}.`;
  logger.error('WAKEUP_STOPPED', message, { data: { lastTick: since, waiting } });
  Sentry.captureMessage(message, 'error');

  const owner = process.env.CONTACT_EMAIL;
  if (owner) {
    const text = [
      message,
      '',
      'Later tries, held night-time leads and queued lists are not being called until it runs again.',
      'Check the job at https://console.cron-job.org: it should call /api/cron/tick every minute with the Authorization header.',
    ].join('\n');
    await sendMail({
      to: owner,
      subject: 'Laycal: the wake-up has stopped, waiting leads are not being called',
      text,
      html: `<p style="font-family:sans-serif;font-size:15px;line-height:24px;color:#111">${text.replace(/\n/g, '<br>')}</p>`,
    });
  }
  return { ok: false, lastTick, waiting };
}
