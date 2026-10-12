import { connectToDatabase } from '@/lib/mongodb';
import { logger } from '@/lib/logger';
import { sendMail } from '@/lib/mail';
import Account, { type IAccount } from '@/models/Account';
import NotificationLog from '@/models/NotificationLog';

/**
 * The four emails a business gets about its own leads.
 *
 * Rules that hold for all of them:
 * - One event, one email. Each has a key; the log row is written before the
 *   send, so the same event reported twice sends once.
 * - Nothing here throws. A mail failure is recorded in NotificationLog and the
 *   caller carries on: the call's result, charge and summary are already saved.
 * - An account is only ever emailed about its own leads, at its own address.
 */

type Kind = 'booked' | 'unreached' | 'stopped' | 'low';

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.laycal.com').replace(/\/$/, '');
const LOGO_URL = 'https://www.laycal.com/assets/logo.png';

const esc = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/* ------------------------------- formatting ------------------------------- */

function safeZone(timezone?: string | null): string {
  try {
    if (timezone) {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone });
      return timezone;
    }
  } catch {
    /* fall through */
  }
  return 'UTC';
}

function part(date: Date, timezone: string, opts: Intl.DateTimeFormatOptions, type: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: timezone, ...opts }).formatToParts(date).find((p) => p.type === type)?.value || '';
}

/** "2:30 PM" */
export function timeIn(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: timezone, hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
}

/** "Tue 14 Oct" or, long, "Tuesday 14 October" */
export function dayIn(date: Date, timezone: string, long = false): string {
  const style = long ? 'long' : 'short';
  return `${part(date, timezone, { weekday: style }, 'weekday')} ${part(date, timezone, { day: 'numeric' }, 'day')} ${part(date, timezone, { month: style }, 'month')}`;
}

/** "EDT", "GMT+1" */
export function zoneName(date: Date, timezone: string): string {
  return part(date, timezone, { timeZoneName: 'short' }, 'timeZoneName') || timezone;
}

const when = (date: Date, timezone: string) => `${dayIn(date, timezone)} at ${timeIn(date, timezone)}`;
const money = (amount: number) => `$${Math.max(0, amount).toFixed(2)}`;

/* -------------------------------- template -------------------------------- */

type Row = [label: string, value: string, href?: string];

function render(input: {
  lead: string;
  rows?: Row[];
  /** Paragraphs under the rows. Plain text; escaped here. */
  body?: string[];
  section?: { title: string; text: string };
  closing?: string;
  button: { label: string; url: string };
  accountName: string;
}): { html: string; text: string } {
  const footer = `You are receiving this because notifications are on for ${input.accountName}. Change this in Settings → Notifications.`;
  const p = 'margin:0 0 16px;font-size:15px;line-height:24px;color:#111111;';

  const rows = (input.rows || [])
    .map(
      ([label, value, href]) =>
        `<tr><td style="padding:6px 16px 6px 0;font-size:13px;line-height:20px;color:#666666;white-space:nowrap;vertical-align:top;">${esc(label)}</td>` +
        `<td style="padding:6px 0;font-size:15px;line-height:22px;color:#111111;">${
          href ? `<a href="${esc(href)}" style="color:#111111;">${esc(value)}</a>` : esc(value)
        }</td></tr>`
    )
    .join('');

  const html = `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#ffffff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
<tr><td style="padding-bottom:28px;"><img src="${LOGO_URL}" alt="Laycal" height="28" style="height:28px;width:auto;display:block;border:0;"></td></tr>
<tr><td>
<p style="margin:0 0 20px;font-size:18px;line-height:26px;font-weight:600;color:#000000;">${esc(input.lead)}</p>
${rows ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">${rows}</table>` : ''}
${(input.body || []).map((line) => `<p style="${p}">${esc(line)}</p>`).join('')}
${
  input.section
    ? `<p style="margin:8px 0 6px;font-size:13px;line-height:20px;font-weight:600;color:#000000;">${esc(input.section.title)}</p><p style="${p}color:#333333;">${esc(input.section.text)}</p>`
    : ''
}
${input.closing ? `<p style="${p}">${esc(input.closing)}</p>` : ''}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 32px;"><tr><td style="border-radius:8px;background:#000000;">
<a href="${esc(input.button.url)}" style="display:inline-block;padding:12px 22px;font-size:15px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;">${esc(input.button.label)}</a>
</td></tr></table>
<p style="margin:0;padding-top:20px;border-top:1px solid #e5e5e5;font-size:12px;line-height:18px;color:#777777;">${esc(footer)}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    input.lead,
    '',
    ...(input.rows || []).map(([label, value]) => `${label}: ${value}`),
    ...(input.rows?.length ? [''] : []),
    ...(input.body || []),
    ...(input.section ? ['', input.section.title, input.section.text] : []),
    ...(input.closing ? ['', input.closing] : []),
    '',
    `${input.button.label}: ${input.button.url}`,
    '',
    footer,
  ].join('\n');

  return { html, text };
}

/* -------------------------------- delivery -------------------------------- */

type AccountLike = Pick<IAccount, 'name' | 'email' | 'timezone' | 'notifications' | 'creditBalance'> & { _id: unknown };

async function loadAccount(accountId: string): Promise<AccountLike | null> {
  await connectToDatabase();
  return Account.findById(accountId).select('name email timezone notifications creditBalance').lean<AccountLike>();
}

const accountName = (account: AccountLike) => account.name?.trim() || account.email;

async function deliver(
  account: AccountLike,
  kind: Kind,
  key: string,
  message: { subject: string; html: string; text: string; leadId?: string }
): Promise<void> {
  const accountId = String(account._id);
  if (account.notifications?.[kind] === false) return;

  const to = account.notifications?.email?.trim() || account.email;
  if (!to) return;

  let row;
  try {
    row = await NotificationLog.create({ key, accountId, kind, to, subject: message.subject, leadId: message.leadId });
  } catch (error: any) {
    // Key already taken: this event has had its email.
    if (error?.code === 11000) return;
    throw error;
  }

  const result = await sendMail({ to, subject: message.subject, html: message.html, text: message.text });

  await NotificationLog.updateOne(
    { _id: row._id },
    { $set: { status: result.status, ...(result.status === 'failed' && { error: result.error }), ...(result.status === 'skipped' && { error: result.reason }) } }
  );

  if (result.status === 'failed') {
    logger.error('NOTIFICATION_FAILED', `Could not send the "${kind}" email`, { accountId, data: { key, to, error: result.error } });
  } else {
    logger.info('NOTIFICATION_' + result.status.toUpperCase(), `"${kind}" email ${result.status}`, { accountId, data: { key, to } });
  }
}

/** Runs a notification so that nothing it does can reach the caller. */
async function guarded(kind: Kind, accountId: string, run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (error) {
    logger.error('NOTIFICATION_ERROR', `The "${kind}" notification failed`, { accountId, error });
  }
}

const today = () => new Date().toISOString().slice(0, 10);

/* --------------------------------- emails --------------------------------- */

type LeadLike = {
  _id: unknown;
  accountId: string;
  name?: string | null;
  phoneNumber: string;
  address?: string | null;
  details?: string | null;
  serviceType?: string | null;
  createdAt?: Date;
  attempts?: { startedAt: Date }[];
};

/** A form that sent no name stores "there" (the agent's greeting), which is no use in a subject line. */
function leadLabel(lead: LeadLike): string {
  const name = (lead.name || '').trim();
  return name && name.toLowerCase() !== 'there' ? name : lead.phoneNumber;
}

/** A meeting was booked on a call that has now ended. */
export function notifyBooked(input: {
  lead: LeadLike;
  callId: string;
  startTime: Date;
  timezone?: string | null;
  assistantName?: string | null;
  summary?: string | null;
}): Promise<void> {
  const { lead } = input;
  return guarded('booked', lead.accountId, async () => {
    const account = await loadAccount(lead.accountId);
    if (!account) return;

    const tz = safeZone(input.timezone || account.timezone);
    const name = leadLabel(lead);
    const zone = zoneName(input.startTime, tz);

    const rows: Row[] = [['Phone', lead.phoneNumber, `tel:${lead.phoneNumber}`]];
    if (lead.address) rows.push(['Address', lead.address]);
    if (input.assistantName) rows.push(['Assistant', input.assistantName]);

    const message = render({
      lead: `${name} is booked for ${dayIn(input.startTime, tz, true)} at ${timeIn(input.startTime, tz)} (${zone}).`,
      rows,
      section: {
        title: 'What was said',
        text: input.summary?.trim() || 'The summary is still being prepared. Open the call to see it.',
      },
      closing: 'The meeting is on your Google Calendar.',
      button: { label: 'Open the call', url: `${APP_URL}/call-summary/${lead._id}` },
      accountName: accountName(account),
    });

    await deliver(account, 'booked', `booked:${input.callId}`, {
      subject: `Meeting booked: ${name}, ${dayIn(input.startTime, tz)} at ${timeIn(input.startTime, tz)}`,
      ...message,
      leadId: String(lead._id),
    });
  });
}

/** A lead from a form did not pick up, after the last try. */
export function notifyUnreached(input: { lead: LeadLike; timezone?: string | null }): Promise<void> {
  const { lead } = input;
  return guarded('unreached', lead.accountId, async () => {
    const account = await loadAccount(lead.accountId);
    if (!account) return;

    const tz = safeZone(input.timezone || account.timezone);
    const name = leadLabel(lead);
    const zoned = (d: Date) => `${when(d, tz)} (${zoneName(d, tz)})`;

    const rows: Row[] = [];
    if (lead.createdAt) rows.push(['Sent the form', zoned(new Date(lead.createdAt))]);
    const calls = (lead.attempts || []).map((a) => new Date(a.startedAt));
    if (calls.length === 1) rows.push(['We called', zoned(calls[0])]);
    if (calls.length > 1) rows.push(['We called', calls.map((d) => when(d, tz)).join(', ') + ` (${zoneName(calls[0], tz)})`]);
    rows.push(['Phone', lead.phoneNumber, `tel:${lead.phoneNumber}`]);
    const asked = [lead.serviceType, lead.details].filter(Boolean).join(': ');
    if (asked) rows.push(['Asked for', asked]);

    const message = render({
      lead: `${name} did not pick up.`,
      rows,
      closing: 'A call from you now is the best next step.',
      button: { label: 'Open the lead', url: `${APP_URL}/call-summary/${lead._id}` },
      accountName: accountName(account),
    });

    await deliver(account, 'unreached', `unreached:${lead._id}:${calls.length ? calls[0].getTime() : 0}`, {
      subject: `We couldn't reach ${name}`,
      ...message,
      leadId: String(lead._id),
    });
  });
}

/** A lead was not called because the balance is empty. At most one a day per account. */
export function notifyCallsStopped(input: { lead: LeadLike; timezone?: string | null }): Promise<void> {
  const { lead } = input;
  return guarded('stopped', lead.accountId, async () => {
    const account = await loadAccount(lead.accountId);
    if (!account) return;

    const tz = safeZone(input.timezone || account.timezone);
    const now = new Date();

    const message = render({
      lead: 'New leads are not being called.',
      rows: [
        ['Balance', money(account.creditBalance)],
        ['Not called', `${leadLabel(lead)}, ${when(now, tz)} (${zoneName(now, tz)})`],
      ],
      closing:
        "Add credits and calls start again with the next lead. Leads that were missed are marked 'Not called' on your Leads page, where you can call each one with Retry.",
      button: { label: 'Add credits', url: `${APP_URL}/dashboard#credits` },
      accountName: accountName(account),
    });

    await deliver(account, 'stopped', `stopped:${lead.accountId}:${today()}`, {
      subject: 'Calls have stopped: your Laycal balance is empty',
      ...message,
      leadId: String(lead._id),
    });
  });
}

/** The balance has just dropped to the low line. At most one a day per account. */
export function notifyLowBalance(input: { accountId: string; balance: number }): Promise<void> {
  return guarded('low', input.accountId, async () => {
    const account = await loadAccount(input.accountId);
    if (!account) return;

    const left = money(input.balance);
    const message = render({
      lead: `You have ${left} left.`,
      body: ['When the balance reaches zero, new leads are not called.'],
      button: { label: 'Add credits', url: `${APP_URL}/dashboard#credits` },
      accountName: accountName(account),
    });

    await deliver(account, 'low', `low:${input.accountId}:${today()}`, {
      subject: `Your Laycal balance is low: ${left} left`,
      ...message,
    });
  });
}
