import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { logger } from '@/lib/logger';
import { createClerkClient } from '@clerk/nextjs/server';

const webhookSecret: string = process.env.CLERK_WEBHOOK_SECRET || '';

// Initialize Clerk client with secret key
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

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
  
  if (eventType === 'user.created') {
    try {
      await connectToDatabase();
      
      const userId = id;
      const userData = evt.data;

      // Check if user already exists (prevent duplicates)
      const existingSubscription = await Subscription.findOne({ userId });
      
      if (!existingSubscription) {
        // Get email from webhook data
        let actualEmail = userData.email_addresses?.[0]?.email_address;
        
        // Fallback email extraction if not in primary array
        if (!actualEmail) {
          actualEmail = userData.email || userData.primary_email_address?.email_address;
          
          // Last resort: try Clerk API
          if (!actualEmail && userData.primary_email_address_id) {
            try {
              await new Promise(resolve => setTimeout(resolve, 1000));
              const fullUser = await clerkClient.users.getUser(userId);
              actualEmail = fullUser.emailAddresses?.[0]?.emailAddress;
            } catch (error) {
              logger.warn('CLERK_API_WARN', 'Could not fetch user details from Clerk API, continuing without email', {
                userId,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              actualEmail = null;
            }
          }
        }
        
        const name = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.username || null;
        
        // Create placeholder subscription - user needs to choose a plan
        const subscription = new Subscription({
          userId,
          planType: 'none',
          planName: 'Plan Selection Required',
          monthlyPrice: 0,
          
          // No limits until plan is chosen
          monthlyMinuteLimit: 0,
          monthlyCallLimit: 0,
          assistantLimit: 0,
          
          // Current period placeholder
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(),
          isTrial: false,
          
          // Usage tracking
          minutesUsed: 0,
          assistantsCreated: 0,
          callsUsed: 0,
          
          // No credits initially
          creditBalance: 0,
          autoTopupEnabled: false,
          
          isActive: false // Inactive until plan is chosen
        });

        // Set metadata explicitly after creation
        subscription.metadata = {
          email: actualEmail || null,
          name: name || null,
          clerkCreatedAt: new Date(userData.created_at || Date.now()),
          webhookSource: true,
          clerkUserId: userData.id,
          primaryEmailId: userData.primary_email_address_id,
          rawUserData: userData
        };

        // Mark metadata as modified for Mongoose
        subscription.markModified('metadata');
        await subscription.save();

        logger.info('USER_CREATED_WEBHOOK', 'User account created, plan selection required', {
          userId,
          email: actualEmail || 'No email found',
          name: name || 'No name found',
          subscriptionId: subscription._id.toString(),
          hasEmail: !!actualEmail,
          hasName: !!name,
          firstName: userData.first_name || 'N/A',
          lastName: userData.last_name || 'N/A'
        });
      }

    } catch (error) {
      logger.error('CLERK_USER_CREATE_ERROR', 'Failed to create user subscription record', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      return NextResponse.json({ 
        error: 'Failed to create user record' 
      }, { status: 500 });
    }
  }

  // Handle user updates (email, name changes)
  if (eventType === 'user.updated') {
    try {
      await connectToDatabase();
      
      const userId = id;
      const userData = evt.data;
      
      // Update existing subscription metadata
      const subscription = await Subscription.findOne({ userId });
      
      if (subscription) {
        subscription.metadata = {
          ...subscription.metadata,
          email: userData.email_addresses?.[0]?.email_address,
          name: `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || null,
          rawUserData: userData // Update with latest user data
        };
        
        subscription.markModified('metadata');
        await subscription.save();

        logger.info('CLERK_USER_UPDATED', 'User metadata updated via Clerk webhook', {
          userId,
          email: subscription.metadata?.email,
          name: subscription.metadata?.name
        });
      }

    } catch (error) {
      logger.error('CLERK_USER_UPDATE_ERROR', 'Failed to update user metadata', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Handle user deletion
  if (eventType === 'user.deleted') {
    try {
      await connectToDatabase();
      
      const userId = id;
      
      // Deactivate user subscription instead of deleting (for audit trail)
      await Subscription.updateMany(
        { userId },
        { 
          isActive: false,
          cancelledAt: new Date(),
          metadata: {
            deletedAt: new Date(),
            deletedReason: 'User account deleted'
          }
        }
      );

      logger.info('CLERK_USER_DELETED', 'User account deactivated via Clerk webhook', {
        userId
      });

    } catch (error) {
      logger.error('CLERK_USER_DELETE_ERROR', 'Failed to deactivate user account', {
        userId: id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return NextResponse.json({ received: true });
}