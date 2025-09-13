import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import Assistant from '@/models/Assistant';
import UsageTracking from '@/models/UsageTracking';
import { logger } from '@/lib/logger';
import { clerkClient } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    const authResult = await AdminAuthService.requirePermission(request, 'view_users');
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const search = url.searchParams.get('search');

    const skip = (page - 1) * limit;

    await connectToDatabase();

    // Build search query
    let searchQuery: any = {};
    if (search) {
      searchQuery = {
        $or: [
          { 'metadata.email': { $regex: search, $options: 'i' } },
          { 'metadata.name': { $regex: search, $options: 'i' } },
          { userId: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get latest subscription per user (in case of multiple subscriptions)
    const subscriptions = await Subscription.aggregate([
      { $match: searchQuery },
      { $sort: { userId: 1, createdAt: -1 } },
      {
        $group: {
          _id: "$userId",
          latestSubscription: { $first: "$$ROOT" }
        }
      },
      { $replaceRoot: { newRoot: "$latestSubscription" } },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit }
    ]);

    const totalAgg = await Subscription.aggregate([
      { $match: searchQuery },
      { $group: { _id: "$userId" } },
      { $count: "total" }
    ]);
    const total = totalAgg[0]?.total || 0;

    // Enrich with additional data and populate missing metadata
    const enrichedUsers = await Promise.all(
      subscriptions.map(async (sub) => {
        const assistantsCount = await Assistant.countDocuments({ 
          userId: sub.userId, 
          isActive: true 
        });

        const todaysUsage = await UsageTracking.findOne({
          userId: sub.userId,
          month: new Date().toISOString().slice(0, 7) // YYYY-MM format
        });

        const callsToday = todaysUsage?.calls?.filter(call => {
          const callDate = new Date(call.createdAt);
          const today = new Date();
          return callDate.toDateString() === today.toDateString();
        })?.length || 0;

        // If metadata is missing, try to get it from Clerk
        let email = sub.metadata?.email;
        let name = sub.metadata?.name;
        
        if (!email || !name) {
          try {
            const clerkUser = await clerkClient.users.getUser(sub.userId);
            email = clerkUser.emailAddresses?.[0]?.emailAddress || email;
            name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || name;
            
            // Update the subscription with the metadata (async, don't wait)
            if (!sub.metadata?.email && (email || name)) {
              Subscription.findByIdAndUpdate(sub._id, {
                metadata: {
                  ...sub.metadata,
                  email,
                  name,
                  clerkCreatedAt: new Date(clerkUser.createdAt)
                }
              }).catch(() => {}); // Silent fail, it's just caching
            }
          } catch (clerkError) {
            // User might not exist in Clerk anymore, use fallback
            logger.warn('ADMIN_CLERK_USER_NOT_FOUND', 'Could not fetch user from Clerk', {
              userId: sub.userId,
              error: clerkError instanceof Error ? clerkError.message : 'Unknown error'
            });
          }
        }

        return {
          _id: sub._id,
          userId: sub.userId,
          email: email || null,
          name: name || null,
          planType: sub.planType,
          planName: sub.planName,
          creditBalance: sub.creditBalance || 0,
          isActive: sub.isActive,
          createdAt: sub.createdAt,
          lastActivity: sub.updatedAt,
          assistantsCreated: assistantsCount,
          callsToday: callsToday,
          totalSpent: todaysUsage?.totalCost || 0
        };
      })
    );

    return NextResponse.json({
      users: enrichedUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    logger.error('ADMIN_GET_USERS_ERROR', 'Failed to get users', { error });
    return NextResponse.json({ error: 'Failed to get users' }, { status: 500 });
  }
}