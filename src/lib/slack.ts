import { logger } from '@/lib/logger';

/**
 * Posts each /contact submission to the owner's Slack, through a Slack
 * Workflow Builder webhook (SLACK_CONTACT_WEBHOOK_URL).
 *
 * The workflow defines three variables: name, email and details. Slack drops
 * anything else, so everything beyond name and email goes into `details` as
 * labelled lines. The form does not ask for a phone number, so there is none.
 *
 * Never throws and never delays the visitor for long: the submission is
 * already saved, and Slack being slow or down must not turn that into an error.
 */

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.laycal.com').replace(/\/$/, '');
/** The owner's own clock, for the "Submitted" line. */
const OWNER_TIMEZONE = 'Africa/Casablanca';

type ContactForSlack = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message: string;
  type?: string | null;
  priority?: string | null;
  createdAt?: Date;
};

function submittedAt(date: Date): string {
  const text = new Intl.DateTimeFormat('en-GB', {
    timeZone: OWNER_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
  const zone =
    new Intl.DateTimeFormat('en-US', { timeZone: OWNER_TIMEZONE, timeZoneName: 'short' })
      .formatToParts(date)
      .find((p) => p.type === 'timeZoneName')?.value || OWNER_TIMEZONE;
  return `${text} (${zone})`;
}

export async function postContactToSlack(contact: ContactForSlack): Promise<void> {
  const url = process.env.SLACK_CONTACT_WEBHOOK_URL;
  if (!url) {
    logger.info('CONTACT_SLACK_SKIPPED', 'Slack webhook not configured', { data: { submissionId: contact.id } });
    return;
  }

  const details = [
    contact.company && `Company: ${contact.company}`,
    `Message: ${contact.message}`,
    contact.type && `Type: ${contact.type}`,
    contact.priority && `Priority: ${contact.priority}`,
    `Submitted: ${submittedAt(contact.createdAt || new Date())}`,
    `Open in admin: ${APP_URL}/admin/contacts`,
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: contact.name,
        email: contact.email,
        details,
      }),
      signal: AbortSignal.timeout(5000),
    });
    const body = await response.text();
    // Slack answers 200 with {"ok":false,...} for some failures, so read the body too.
    if (!response.ok || body.includes('"ok":false')) {
      logger.error('CONTACT_SLACK_FAILED', 'Slack refused the contact submission', {
        data: { submissionId: contact.id, status: response.status, body: body.slice(0, 200) },
      });
      return;
    }
    logger.info('CONTACT_SLACK_SENT', 'Contact submission posted to Slack', { data: { submissionId: contact.id } });
  } catch (error) {
    logger.error('CONTACT_SLACK_ERROR', 'Could not reach Slack', { data: { submissionId: contact.id }, error });
  }
}
