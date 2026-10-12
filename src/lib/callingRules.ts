/**
 * When a lead may be called, and how often.
 *
 * Calling hours are not the assistant's business hours. Business hours say
 * when a visit can be booked; calling hours say when the phone may ring.
 */

export type CallingRules = {
  retry: boolean;
  maxCalls: number;
  holdOutsideHours: boolean;
  /** 24-hour "HH:MM" in the assistant's time zone. */
  callFrom: string;
  callUntil: string;
};

export const DEFAULT_CALLING_RULES: CallingRules = {
  retry: true,
  maxCalls: 3,
  holdOutsideHours: false,
  callFrom: '08:00',
  callUntil: '21:00',
};

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** The rules for an assistant, with defaults filled in for assistants that predate them. */
export function callingRulesOf(assistant: any): CallingRules {
  const r = assistant?.callingRules || {};
  const maxCalls = [1, 2, 3].includes(Number(r.maxCalls)) ? Number(r.maxCalls) : DEFAULT_CALLING_RULES.maxCalls;
  const callFrom = HHMM.test(r.callFrom || '') ? r.callFrom : DEFAULT_CALLING_RULES.callFrom;
  const callUntil = HHMM.test(r.callUntil || '') ? r.callUntil : DEFAULT_CALLING_RULES.callUntil;
  return {
    retry: r.retry !== false,
    maxCalls,
    holdOutsideHours: r.holdOutsideHours === true,
    callFrom,
    callUntil,
  };
}

export function assistantTimezone(assistant: any, fallback?: string | null): string {
  const tz = assistant?.serviceConfig?.timezone || fallback || 'America/New_York';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    return 'America/New_York';
  }
}

const minutes = (hhmm: string) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

/** Returns a message when the hours are unusable, otherwise null. */
export function validateCallingHours(callFrom: string, callUntil: string): string | null {
  if (!HHMM.test(callFrom) || !HHMM.test(callUntil)) return 'Enter the calling hours as times.';
  if (minutes(callUntil) <= minutes(callFrom)) return 'The end time must be after the start time.';
  return null;
}

/** Wall-clock parts of an instant in a time zone. */
function partsIn(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

/** The instant at which a wall-clock time occurs in a time zone. */
function instantFor(year: number, month: number, day: number, hour: number, minute: number, timezone: string): Date {
  const wanted = Date.UTC(year, month - 1, day, hour, minute);
  let guess = wanted;
  // Two passes settle the offset, including across a daylight-saving change.
  for (let i = 0; i < 2; i++) {
    const p = partsIn(new Date(guess), timezone);
    const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
    guess += wanted - shown;
  }
  return new Date(guess);
}

/**
 * The first moment at or after `at` that falls inside the calling hours.
 * Returns `at` itself when it is already inside them.
 */
export function nextCallingTime(at: Date, rules: Pick<CallingRules, 'callFrom' | 'callUntil'>, timezone: string): Date {
  const from = minutes(rules.callFrom);
  const until = minutes(rules.callUntil);
  const p = partsIn(at, timezone);
  const now = p.hour * 60 + p.minute;

  if (now >= from && now < until) return at;

  const fromHour = Math.floor(from / 60);
  const fromMinute = from % 60;
  if (now < from) return instantFor(p.year, p.month, p.day, fromHour, fromMinute, timezone);

  // Past closing: the opening on the next calendar day. Date.UTC rolls the month over.
  const tomorrow = new Date(Date.UTC(p.year, p.month - 1, p.day + 1));
  return instantFor(tomorrow.getUTCFullYear(), tomorrow.getUTCMonth() + 1, tomorrow.getUTCDate(), fromHour, fromMinute, timezone);
}

/**
 * Seconds to wait before each later call: after the first, after the second.
 * `RETRY_DELAYS_SECONDS` ("60,120") shortens them for testing.
 */
export function retryDelaysSeconds(): number[] {
  const custom = (process.env.RETRY_DELAYS_SECONDS || '')
    .split(',')
    .map((v) => Number(v.trim()))
    .filter((v) => Number.isFinite(v) && v > 0);
  return custom.length ? custom : [10 * 60, 2 * 60 * 60];
}
