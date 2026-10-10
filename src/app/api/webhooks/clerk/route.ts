import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Membership from '@/models/Membership';
import { logger } from '@/lib/logger';

const webhookSecret: string = process.env.CLERK_WEBHOOK_SECRET || '';

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Missing CLERK_WEBHOOK_SECRET' }, { status: 500 });
  }

  if (!process.env.CLERK_SECRET_KEY) {
    return NextResponse.json({ error: 'Missing CLERK_SECRET_KEY' }, { status: 500 });
  }

  // Get the headers
  const headerPayload = req.headers;
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Get the body
  const payload = await req.text();

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    logger.error('CLERK_WEBHOOK_VERIFY_ERROR', 'Failed to verify Clerk webhook', { err });
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  logger.info('CLERK_WEBHOOK_RECEIVED', 'Clerk webhook event received', {
    eventType,
    id,
    timestamp: evt.timestamp
  });
  
  // Accounts are linked on first sign-in (lib/account), so user.created needs
  // nothing here. A deleted login loses its membership; the account and its
  // data stay, because they belong to the business, not to that person.
  if (eventType === 'user.deleted' && id) {
    try {
      await connectToDatabase();
      await Membership.deleteOne({ userId: id });
      logger.info('CLERK_USER_DELETED', 'Removed membership for deleted user', { userId: id });
    } catch (error) {
      logger.error('CLERK_USER_DELETE_ERROR', 'Failed to remove membership', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({ received: true });
}
