import nodemailer from 'nodemailer';

/**
 * Sends through the owner's own mailbox.
 *
 * Needs CONTACT_EMAIL, CONTACT_EMAIL_PASS, SMTP_SERVER and SMTP_PORT. When any
 * is missing (a local machine, a preview build) nothing is sent and the caller
 * is told so, rather than anything throwing.
 */

export type MailResult = { status: 'sent' } | { status: 'skipped'; reason: string } | { status: 'failed'; error: string };

let transporter: nodemailer.Transporter | null = null;

export function mailConfigured(): boolean {
  return !!(process.env.CONTACT_EMAIL && process.env.CONTACT_EMAIL_PASS && process.env.SMTP_SERVER && process.env.SMTP_PORT);
}

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_SERVER,
      port,
      secure: port === 465,
      auth: { user: process.env.CONTACT_EMAIL, pass: process.env.CONTACT_EMAIL_PASS },
      // A slow mail server must not hold up the call's result being saved.
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });
  }
  return transporter;
}

export async function sendMail(input: { to: string; subject: string; html: string; text: string }): Promise<MailResult> {
  if (!mailConfigured()) return { status: 'skipped', reason: 'Mail details are not configured' };
  try {
    await getTransporter().sendMail({
      from: `Laycal <${process.env.CONTACT_EMAIL}>`,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    return { status: 'sent' };
  } catch (error) {
    return { status: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}
