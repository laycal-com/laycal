import { tradeLabel } from './verticals';

/**
 * A spelled-out calendar for the next week, in the assistant's timezone.
 *
 * The prompt used to give the model only "July 27, 2026" and ask it to resolve
 * "Thursday" itself. That requires knowing which weekday a given date falls on
 * and then counting forward — arithmetic language models reliably get wrong.
 * It booked a Tuesday when the homeowner asked for Thursday.
 *
 * Handing over the actual dates removes the arithmetic entirely: the model only
 * has to read a line.
 */
export function buildDateReference(timezone: string, now: Date = new Date()): string {
  const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat('en-US', { timeZone: timezone, ...opts }).format(d);

  const line = (d: Date, label: string) =>
    `${label}: ${fmt(d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;

  const lines = [
    line(now, 'TODAY'),
    line(new Date(now.getTime() + 86_400_000), 'TOMORROW'),
  ];

  // Days 2-7 out. Starting at 2 avoids printing "Wednesday" twice when tomorrow
  // is already the next Wednesday, which invites the model to pick either one.
  for (let i = 2; i <= 7; i++) {
    const d = new Date(now.getTime() + i * 86_400_000);
    lines.push(`Next ${fmt(d, { weekday: 'long' })}: ${fmt(d, { month: 'long', day: 'numeric', year: 'numeric' })}`);
  }

  const time = fmt(now, { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${lines.join('\n')}\nCurrent time: ${time} (${timezone})`;
}

/**
 * Builds the `variableValues` payload for a Vapi call.
 *
 * Generated prompts reference {{client_company}}, {{service_type}} and
 * {{address}}. Vapi rejects unknown keys on the `customer` object, so these can
 * only travel via assistantOverrides.variableValues — and any call path that
 * forgets them renders those placeholders as empty strings mid-conversation.
 *
 * Every caller of initiateCall should use this so no path can silently drift.
 */
export function buildCallVariables(
  assistant: any,
  lead?: {
    address?: string | null;
    details?: string | null;
    availability?: string | null;
    serviceType?: string | null;
    company?: string | null;
    name?: string | null;
  }
): Record<string, string> {
  const cfg = assistant?.serviceConfig;

  const serviceType =
    lead?.serviceType ||
    tradeLabel(cfg?.vertical, cfg?.customTrade) ||
    'service';

  return {
    // Falls back to the assistant name so the agent never says a blank company.
    client_company: cfg?.clientCompany || assistant?.name || 'our team',
    service_type: serviceType,
    address: lead?.address || 'not provided',
    details: lead?.details || '',
    stated_availability: lead?.availability || '',
    date_reference: buildDateReference(cfg?.timezone || 'America/New_York'),
  };
}
