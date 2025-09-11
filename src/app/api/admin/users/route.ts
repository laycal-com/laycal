import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import Assistant from '@/models/Assistant';
import UsageTracking from '@/models/UsageTracking';
import { logger } from '@/lib/logger';

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

    // Get subscriptions with user data
    const subscriptions = await Subscription.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Subscription.countDocuments(searchQuery);

    // Enrich with additional data
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

        return {
          _id: sub._id,
          userId: sub.userId,
          email: sub.metadata?.email,
          name: sub.metadata?.name,
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