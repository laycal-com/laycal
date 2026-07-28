/**
 * Formats a booked visit in the *business's* timezone.
 *
 * Appointments are stored as UTC instants. Rendering them with the viewer's
 * local zone is wrong for this product: the agent promised the homeowner a
 * wall-clock time in the business's zone, and that is the time the technician
 * turns up. A dispatcher travelling, or an operator in a different country,
 * would otherwise see a time nobody ever said out loud.
 *
 * Falls back to the viewer's zone when the appointment predates the field.
 */
export function formatVisit(
  iso: string,
  timezone?: string | null,
  opts: Intl.DateTimeFormatOptions = {}
): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';

  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...opts,
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(d);
}

/** Short zone label, e.g. "EDT", for appending to a rendered time. */
export function zoneLabel(iso: string, timezone?: string | null): string {
  if (!timezone) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const part = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
    .formatToParts(d)
    .find((p) => p.type === 'timeZoneName');
  return part?.value ?? '';
}
