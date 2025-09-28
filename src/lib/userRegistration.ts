import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import { logger } from '@/lib/logger';
import { currentUser } from '@clerk/nextjs/server';

/**
 * Ensures a user record exists in the database
 * This is a fallback mechanism for when webhooks might not work
 */
export async function ensureUserExists(userId: string): Promise<void> {
  try {
    await connectToDatabase();
    
    // Check if subscription record already exists
    const existingSubscription = await Subscription.findOne({ userId });
    
    if (!existingSubscription) {
      // Get user data from Clerk
      const user = await currentUser();
      
      if (user) {
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
          
          isActive: false, // Inactive until plan is chosen
          metadata: {
            email: user.emailAddresses?.[0]?.emailAddress,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
            clerkCreatedAt: new Date(user.createdAt)
          }
        });

        await subscription.save();

        logger.info('USER_CREATED_FALLBACK', 'User account created, plan selection required', {
          userId,
          email: user.emailAddresses?.[0]?.emailAddress,
          name: subscription.metadata?.name,
          subscriptionId: subscription._id.toString()
        });
      }
    }
  } catch (error) {
    logger.error('USER_ENSURE_ERROR', 'Failed to ensure user exists', {
      userId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Middleware function to ensure user exists when accessing protected routes
 */
export async function withUserEnsured<T>(
  userId: string,
  handler: () => Promise<T>
): Promise<T> {
  await ensureUserExists(userId);
  return handler();
}