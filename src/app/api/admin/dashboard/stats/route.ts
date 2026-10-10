import { NextRequest, NextResponse } from 'next/server';
import { AdminAuthService } from '@/lib/adminAuth';
import { connectToDatabase } from '@/lib/mongodb';
import Account from '@/models/Account';
import Assistant from '@/models/Assistant';
import CreditLedger from '@/models/CreditLedger';
import ContactSubmission from '@/models/ContactSubmission';
import SupportTicket from '@/models/SupportTicket';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const authResult = await AdminAuthService.requireAuth(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    await connectToDatabase();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Revenue is money customers paid in (top-ups), not credits an admin granted.
    const sumTopups = (since?: Date) =>
      CreditLedger.aggregate([
        { $match: { type: 'topup', ...(since ? { createdAt: { $gte: since } } : {}) } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

    const [totalUsers, activeUsers, monthlyRevenue, totalRevenue, totalAssistants, pendingContacts, openTickets, callsToday] =
      await Promise.all([
        Account.countDocuments({}),
        Account.countDocuments({ status: 'active' }),
        sumTopups(startOfMonth),
        sumTopups(),
        Assistant.countDocuments({}),
        ContactSubmission.countDocuments({ status: 'new' }),
        SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress', 'waiting_customer', 'waiting_internal'] } }),
        CreditLedger.countDocuments({ type: 'call', createdAt: { $gte: startOfToday } }),
      ]);

    const monthlyRevenueValue = monthlyRevenue[0]?.total || 0;
    const totalRevenueValue = totalRevenue[0]?.total || 0;
    const todaysStats = { totalCalls: callsToday };

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