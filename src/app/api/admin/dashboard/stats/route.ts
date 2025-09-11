import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import Subscription from '@/models/Subscription';
import Assistant from '@/models/Assistant';
import Credit from '@/models/Credit';
import ContactSubmission from '@/models/ContactSubmission';
import SupportTicket from '@/models/SupportTicket';
import UsageTracking from '@/models/UsageTracking';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await AdminAuthService.requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();

    // Get current date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Parallel queries for better performance
    const [
      totalUsers,
      activeUsers,
      monthlyRevenue,
      totalRevenue,
      totalAssistants,
      pendingContacts,
      openTickets,
      todaysUsage
    ] = await Promise.all([
      // Total users
      Subscription.countDocuments({ isActive: true }),
      
      // Active users this month
      Subscription.countDocuments({ 
        isActive: true, 
        updatedAt: { $gte: startOfMonth } 
      }),
      
      // Monthly revenue from credits
      Credit.aggregate([
        {
          $match: {
            type: { $in: ['topup', 'subscription'] },
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      
      // Total revenue all time
      Credit.aggregate([
        {
          $match: {
            type: { $in: ['topup', 'subscription'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]),
      
      // Total assistants created
      Assistant.countDocuments({ isActive: true }),
      
      // Pending contacts
      ContactSubmission.countDocuments({ status: 'new' }),
      
      // Open support tickets
      SupportTicket.countDocuments({ 
        status: { $in: ['open', 'in_progress', 'waiting_customer', 'waiting_internal'] }
      }),
      
      // Today's usage stats
      UsageTracking.aggregate([
        {
          $match: {
            'calls.createdAt': { $gte: startOfToday }
          }
        },
        {
          $unwind: '$calls'
        },
        {
          $match: {
            'calls.createdAt': { $gte: startOfToday }
          }
        },
        {
          $group: {
            _id: null,
            totalCalls: { $sum: 1 },
            totalMinutes: { $sum: '$calls.minutes' }
          }
        }
      ])
    ]);

    // Extract values from aggregation results
    const monthlyRevenueValue = monthlyRevenue[0]?.total || 0;
    const totalRevenueValue = totalRevenue[0]?.total || 0;
    const todaysStats = todaysUsage[0] || { totalCalls: 0, totalMinutes: 0 };

    // System health check
    const systemHealth = {
      status: 'healthy' as const,
      uptime: process.uptime ? `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m` : 'N/A',
      lastUpdate: new Date().toISOString()
    };

    const stats = {
      totalUsers,
      activeUsers,
      totalRevenue: totalRevenueValue,
      monthlyRevenue: monthlyRevenueValue,
      totalCalls: todaysStats.totalCalls,
      monthlyCallsToday: todaysStats.totalCalls,
      assistantsCreated: totalAssistants,
      pendingContacts,
      openTickets,
      systemHealth
    };

    logger.info('ADMIN_DASHBOARD_STATS', 'Dashboard stats retrieved', {
      stats: {
        totalUsers,
        activeUsers,
        monthlyRevenue: monthlyRevenueValue,
        totalAssistants,
        pendingContacts,
        openTickets
      }
    });

    return NextResponse.json(stats);

  } catch (error) {
    logger.error('ADMIN_DASHBOARD_STATS_ERROR', 'Failed to get dashboard stats', { error });
    return NextResponse.json({ error: 'Failed to get dashboard stats' }, { status: 500 });
  }
}