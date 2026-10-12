/**
 * The words shown for a lead's state, in one place so the Leads page and the
 * lead's own page always agree. Safe to import in the browser.
 *
 * A status is never colour alone: every dot comes with these words.
 */

export type LeadStatusInput = {
  status: 'pending' | 'calling' | 'completed' | 'failed';
  outcome?: 'no_answer' | 'no_credits' | 'not_placed' | 'invalid_number' | 'stopped' | null;
  tries?: number;
  /** Calls allowed in total, from the lead's assistant. */
  maxCalls?: number;
  nextCallAt?: string | Date | null;
  callResults?: { answered?: boolean | null } | null;
};

export type LeadStatusView = { label: string; dot: string; pulse?: boolean; waiting: boolean };

const DOT = {
  idle: 'bg-muted-foreground/50',
  live: 'bg-primary',
  good: 'bg-green-500',
  warn: 'bg-amber-500',
  bad: 'bg-red-500',
};

const time = (d: Date) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

/** "8:00 AM", "8:00 AM tomorrow" or "8:00 AM on Monday". */
export function callTimeLabel(at: Date, now: Date = new Date()): string {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((day(at) - day(now)) / 86_400_000);
  if (days <= 0) return time(at);
  if (days === 1) return `${time(at)} tomorrow`;
  return `${time(at)} on ${at.toLocaleDateString(undefined, { weekday: 'long' })}`;
}

export function leadStatus(lead: LeadStatusInput, now: Date = new Date()): LeadStatusView {
  const tries = Math.max(0, Number(lead.tries) || 0);
  const maxCalls = Math.max(1, Number(lead.maxCalls) || 3);

  if (lead.status === 'calling') return { label: 'Calling', dot: DOT.live, pulse: true, waiting: false };
  if (lead.status === 'completed') return { label: 'Completed', dot: DOT.good, waiting: false };

  if (lead.status === 'pending') {
    if (!lead.nextCallAt) return { label: 'Queued', dot: DOT.idle, waiting: false };
    const at = new Date(lead.nextCallAt);
    if (tries > 0) {
      return {
        label: `No answer · Trying again at ${callTimeLabel(at, now)} (${Math.min(tries + 1, maxCalls)} of ${maxCalls})`,
        dot: DOT.warn,
        waiting: true,
      };
    }
    // Queued behind others and due now, rather than held for the morning.
    if (at.getTime() <= now.getTime() + 60_000) return { label: 'Queued', dot: DOT.idle, waiting: true };
    return { label: `Waiting · Calls at ${callTimeLabel(at, now)}`, dot: DOT.idle, waiting: true };
  }

  switch (lead.outcome) {
    case 'no_answer':
      return { label: tries > 1 ? `No answer after ${tries} calls` : 'No answer', dot: DOT.warn, waiting: false };
    case 'no_credits':
      return { label: 'Not called · No credits', dot: DOT.bad, waiting: false };
    case 'not_placed':
      return { label: 'Not called · Call could not be placed', dot: DOT.bad, waiting: false };
    case 'invalid_number':
      return { label: 'Not called · Number not valid', dot: DOT.bad, waiting: false };
    case 'stopped':
      return { label: 'Stopped by you', dot: DOT.idle, waiting: false };
  }

  // Leads from before outcomes were recorded.
  if (lead.callResults && lead.callResults.answered === false) return { label: 'No answer', dot: DOT.warn, waiting: false };
  return { label: 'Failed', dot: DOT.bad, waiting: false };
}

/** One line per call for the lead's own page: "10:32 AM · No answer". */
export function attemptLabel(result?: string | null): string {
  switch (result) {
    case 'answered':
      return 'Answered';
    case 'no_answer':
      return 'No answer';
    case 'busy':
      return 'Busy';
    case 'voicemail':
      return 'Voicemail';
    case 'not_connected':
      return 'Could not connect';
    default:
      return 'In progress';
  }
}
